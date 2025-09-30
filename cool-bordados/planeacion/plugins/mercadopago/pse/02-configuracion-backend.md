# Configuración del Backend - PSE con Mercado Pago

## 1. Registro y Configuración en Mercado Pago

### 1.1 Creación de Aplicación
1. **Acceder al Panel de Desarrolladores**
   - URL: https://www.mercadopago.com.co/developers/panel/app
   - Crear nueva aplicación o usar existente

2. **Configuración de la Aplicación**
   ```json
   {
     "name": "Cool Bordados - PSE Integration",
     "description": "Integración PSE para pagos en línea",
     "category": "ecommerce",
     "country": "CO",
     "payment_methods": ["pse"]
   }
   ```

3. **Obtención de Credenciales**
   ```bash
   # Sandbox
   MERCADOPAGO_ACCESS_TOKEN_SANDBOX=TEST-1234567890-abcdef
   MERCADOPAGO_PUBLIC_KEY_SANDBOX=TEST-abcdef-1234567890
   
   # Producción
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-abcdef
   MERCADOPAGO_PUBLIC_KEY=APP_USR-abcdef-1234567890
   ```

### 1.2 Configuración de Webhooks
```javascript
// Configuración de webhook para PSE
{
  "url": "https://your-domain.com/hooks/payment/mercadopago-pse_mercadopago",
  "events": [
    "payment.created",
    "payment.updated"
  ]
}
```

## 2. Extensión del Plugin MedusaJS

### 2.1 Estructura de Archivos
```
src/
├── modules/
│   └── pse-payment/
│       ├── service.ts
│       ├── models/
│       │   └── pse-transaction.ts
│       └── types/
│           └── index.ts
├── api/
│   ├── store/
│   │   └── pse/
│   │       ├── route.ts
│   │       ├── financial-institutions/
│   │       │   └── route.ts
│   │       └── validate/
│   │           └── route.ts
│   └── webhooks/
│       └── mercadopago/
│           └── pse/
│               └── route.ts
└── subscribers/
    └── pse-payment.ts
```

### 2.2 Modelo de Datos PSE
```typescript
// src/modules/pse-payment/models/pse-transaction.ts
import { BaseEntity } from "@medusajs/framework/utils"

export class PSETransaction extends BaseEntity {
  payment_session_id: string
  bank_code: string
  bank_name: string
  document_type: string
  document_number: string
  entity_type: "individual" | "company"
  pse_reference: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  redirect_url?: string
  callback_url?: string
  created_at: Date
  updated_at: Date
}
```

### 2.3 Servicio PSE
```typescript
// src/modules/pse-payment/service.ts
import { AbstractPaymentProvider } from "@medusajs/framework/types"
import { MercadoPagoAPI } from "./mercadopago-api"

export class PSEPaymentService extends AbstractPaymentProvider {
  private mercadoPagoAPI: MercadoPagoAPI

  constructor(container, options) {
    super(container, options)
    this.mercadoPagoAPI = new MercadoPagoAPI(options.access_token)
  }

  async getFinancialInstitutions(): Promise<FinancialInstitution[]> {
    const paymentMethods = await this.mercadoPagoAPI.getPaymentMethods()
    const pseMethod = paymentMethods.find(method => method.id === 'pse')
    return pseMethod?.financial_institutions || []
  }

  async validatePSEData(data: PSEValidationData): Promise<ValidationResult> {
    // Validar tipo de documento colombiano
    const validDocumentTypes = ['CC', 'CE', 'NIT', 'PP']
    if (!validDocumentTypes.includes(data.document_type)) {
      return { valid: false, error: 'Tipo de documento inválido' }
    }

    // Validar número de documento
    if (!this.validateDocumentNumber(data.document_type, data.document_number)) {
      return { valid: false, error: 'Número de documento inválido' }
    }

    return { valid: true }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<PaymentProviderSessionResponse> {
    const { amount, currency_code, context } = input
    const { pse_data } = context

    // Validar datos PSE
    const validation = await this.validatePSEData(pse_data)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Crear pago en Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      payment_method_id: "pse",
      payer: {
        email: context.email,
        identification: {
          type: pse_data.document_type,
          number: pse_data.document_number
        },
        entity_type: pse_data.entity_type
      },
      additional_info: {
        ip_address: context.ip_address
      },
      callback_url: `${process.env.STORE_URL}/checkout/payment-success`,
      notification_url: `${process.env.BACKEND_URL}/hooks/payment/mercadopago-pse_mercadopago`
    }

    const payment = await this.mercadoPagoAPI.createPayment(paymentData)

    // Guardar transacción PSE
    await this.savePSETransaction({
      payment_session_id: input.session_id,
      bank_code: pse_data.bank_code,
      bank_name: pse_data.bank_name,
      document_type: pse_data.document_type,
      document_number: pse_data.document_number,
      entity_type: pse_data.entity_type,
      pse_reference: payment.id,
      status: payment.status,
      redirect_url: payment.transaction_details?.external_resource_url
    })

    return {
      session_data: {
        id: payment.id,
        status: payment.status,
        redirect_url: payment.transaction_details?.external_resource_url
      }
    }
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload): Promise<WebhookActionResult> {
    const { data } = payload.payload

    try {
      // Obtener detalles del pago desde Mercado Pago
      const payment = await this.mercadoPagoAPI.getPayment(data.id)
      
      // Actualizar transacción PSE
      await this.updatePSETransaction(payment.id, {
        status: payment.status,
        updated_at: new Date()
      })

      switch (payment.status) {
        case "approved":
          return {
            action: "captured",
            data: {
              session_id: payment.metadata?.session_id,
              amount: new BigNumber(payment.transaction_amount)
            }
          }
        case "pending":
          return {
            action: "authorized",
            data: {
              session_id: payment.metadata?.session_id,
              amount: new BigNumber(payment.transaction_amount)
            }
          }
        case "rejected":
        case "cancelled":
          return {
            action: "failed",
            data: {
              session_id: payment.metadata?.session_id,
              amount: new BigNumber(payment.transaction_amount),
              error: payment.status_detail
            }
          }
        default:
          return {
            action: "not_supported",
            data: {
              session_id: "",
              amount: new BigNumber(0)
            }
          }
      }
    } catch (error) {
      return {
        action: "failed",
        data: {
          session_id: "",
          amount: new BigNumber(0),
          error: error.message
        }
      }
    }
  }

  private validateDocumentNumber(type: string, number: string): boolean {
    switch (type) {
      case 'CC': // Cédula de Ciudadanía
        return /^\d{6,10}$/.test(number)
      case 'CE': // Cédula de Extranjería
        return /^\d{6,10}$/.test(number)
      case 'NIT': // Número de Identificación Tributaria
        return /^\d{9,10}$/.test(number)
      case 'PP': // Pasaporte
        return /^[A-Z0-9]{6,12}$/.test(number)
      default:
        return false
    }
  }
}
```

## 3. API Routes

### 3.1 Endpoint de Instituciones Financieras
```typescript
// src/api/store/pse/financial-institutions/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PSEPaymentService } from "../../../../modules/pse-payment/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const pseService = req.scope.resolve("psePaymentService") as PSEPaymentService
    const institutions = await pseService.getFinancialInstitutions()

    res.json({
      financial_institutions: institutions
    })
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener instituciones financieras",
      details: error.message
    })
  }
}
```

### 3.2 Endpoint de Validación PSE
```typescript
// src/api/store/pse/validate/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PSEPaymentService } from "../../../../modules/pse-payment/service"

interface PSEValidationRequest {
  document_type: string
  document_number: string
  bank_code: string
  entity_type: "individual" | "company"
}

export async function POST(
  req: MedusaRequest<PSEValidationRequest>,
  res: MedusaResponse
): Promise<void> {
  try {
    const pseService = req.scope.resolve("psePaymentService") as PSEPaymentService
    const validation = await pseService.validatePSEData(req.body)

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      })
    }

    res.json({
      valid: true,
      message: "Datos PSE válidos"
    })
  } catch (error) {
    res.status(500).json({
      error: "Error en validación PSE",
      details: error.message
    })
  }
}
```

### 3.3 Webhook Handler PSE
```typescript
// src/api/webhooks/mercadopago/pse/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PSEPaymentService } from "../../../../modules/pse-payment/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const pseService = req.scope.resolve("psePaymentService") as PSEPaymentService
    
    // Validar webhook signature
    const isValid = await pseService.validateWebhookSignature(
      req.body,
      req.headers["x-signature"] as string
    )

    if (!isValid) {
      return res.status(401).json({ error: "Webhook signature inválida" })
    }

    // Procesar webhook
    const result = await pseService.getWebhookActionAndData({
      payload: {
        data: req.body,
        rawData: req.rawBody,
        headers: req.headers
      }
    })

    // Log del evento
    console.log(`PSE Webhook procesado: ${result.action}`, {
      payment_id: req.body.id,
      action: result.action,
      timestamp: new Date().toISOString()
    })

    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Error procesando webhook PSE:", error)
    res.status(500).json({
      error: "Error procesando webhook",
      details: error.message
    })
  }
}
```

## 4. Configuración del Módulo

### 4.1 Actualización de medusa-config.ts
```typescript
// medusa-config.ts
import { defineConfig } from "@medusajs/framework/utils"

module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@nicogorga/medusa-payment-mercadopago",
            id: "mercadopago",
            options: {
              access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
              webhook_secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
            },
          },
          {
            resolve: "./src/modules/pse-payment",
            id: "mercadopago-pse",
            options: {
              access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
              webhook_secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
              sandbox: process.env.NODE_ENV !== "production",
            },
          },
        ],
      },
    },
  ],
})
```

### 4.2 Variables de Entorno
```bash
# .env
# Mercado Pago PSE Configuration
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret

# URLs
BACKEND_URL=https://your-backend.com
STORE_URL=https://your-store.com

# PSE Specific
PSE_ENABLED=true
PSE_SANDBOX=true
```

## 5. Logging y Monitoreo

### 5.1 Servicio de Logging PSE
```typescript
// src/modules/pse-payment/logger.ts
export class PSELogger {
  static logTransaction(event: string, data: any) {
    console.log(`[PSE] ${event}:`, {
      timestamp: new Date().toISOString(),
      event,
      data: {
        payment_id: data.payment_id,
        status: data.status,
        amount: data.amount,
        bank_code: data.bank_code
      }
    })
  }

  static logError(error: string, details: any) {
    console.error(`[PSE ERROR] ${error}:`, {
      timestamp: new Date().toISOString(),
      error,
      details
    })
  }

  static logWebhook(payload: any) {
    console.log(`[PSE WEBHOOK]:`, {
      timestamp: new Date().toISOString(),
      payment_id: payload.id,
      type: payload.type,
      status: payload.data?.status
    })
  }
}
```

## 6. Testing y Validación

### 6.1 Datos de Prueba PSE
```javascript
// Datos de prueba para sandbox
const testData = {
  document_type: "CC",
  document_number: "12345678",
  bank_code: "1007", // Bancolombia
  entity_type: "individual",
  email: "test@example.com",
  amount: 50000 // COP
}
```

### 6.2 Scripts de Testing
```typescript
// scripts/test-pse.ts
import { PSEPaymentService } from "../src/modules/pse-payment/service"

async function testPSEFlow() {
  const pseService = new PSEPaymentService({}, {
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
    sandbox: true
  })

  // Test 1: Obtener instituciones financieras
  const institutions = await pseService.getFinancialInstitutions()
  console.log("Instituciones financieras:", institutions.length)

  // Test 2: Validar datos PSE
  const validation = await pseService.validatePSEData({
    document_type: "CC",
    document_number: "12345678",
    bank_code: "1007",
    entity_type: "individual"
  })
  console.log("Validación:", validation)

  // Test 3: Iniciar pago
  const payment = await pseService.initiatePayment({
    amount: 50000,
    currency_code: "COP",
    context: {
      email: "test@example.com",
      pse_data: {
        document_type: "CC",
        document_number: "12345678",
        bank_code: "1007",
        bank_name: "Bancolombia",
        entity_type: "individual"
      }
    }
  })
  console.log("Pago iniciado:", payment)
}
```

## 7. Seguridad y Compliance

### 7.1 Validación de Webhooks
```typescript
// Validación de firma de webhook
async validateWebhookSignature(payload: any, signature: string): Promise<boolean> {
  const crypto = require('crypto')
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  const expectedSignature = hmac.digest('hex')
  
  return signature === expectedSignature
}
```

### 7.2 Sanitización de Datos
```typescript
// Sanitizar datos de entrada
sanitizePSEData(data: any): PSEData {
  return {
    document_type: data.document_type?.toUpperCase().trim(),
    document_number: data.document_number?.replace(/\D/g, ''),
    bank_code: data.bank_code?.trim(),
    entity_type: data.entity_type === 'company' ? 'company' : 'individual'
  }
}
```

## 8. Próximos Pasos

1. **Implementar el servicio PSE**: Crear el servicio base con los métodos requeridos
2. **Crear API endpoints**: Implementar los endpoints para instituciones financieras y validación
3. **Configurar webhooks**: Implementar el handler de webhooks específico para PSE
4. **Testing**: Probar la integración en sandbox
5. **Documentación**: Crear documentación técnica detallada

---

**Estado**: Plan de Backend Completado  
**Próximo Paso**: Implementación Frontend  
**Estimación**: 2-3 semanas de desarrollo