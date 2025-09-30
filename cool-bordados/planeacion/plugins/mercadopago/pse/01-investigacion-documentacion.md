# Investigación y Documentación - PSE con Mercado Pago

## 1. Documentación Oficial de Mercado Pago - PSE

### 1.1 Información General de PSE
- **PSE (Pagos Seguros en Línea)**: Sistema de pagos en línea de Colombia que permite realizar transferencias bancarias directas
- **Disponibilidad**: Exclusivo para Colombia (MCO)
- **Tipo de pago**: Transferencia bancaria directa desde la cuenta del usuario

### 1.2 Requisitos Técnicos PSE

#### Obtención de Métodos de Pago
```javascript
// Endpoint para obtener métodos de pago disponibles
GET https://api.mercadopago.com/v1/payment_methods?public_key=YOUR_PUBLIC_KEY

// Respuesta incluye PSE con instituciones financieras
{
  "id": "pse",
  "name": "PSE",
  "payment_type_id": "bank_transfer",
  "status": "active",
  "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/pse.gif",
  "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/pse.gif",
  "financial_institutions": [
    {
      "id": "1040",
      "description": "Banco Agrario"
    },
    {
      "id": "1007",
      "description": "Bancolombia"
    }
    // ... más bancos
  ]
}
```

#### Datos Requeridos para PSE
1. **Tipo de documento**: CC (Cédula de Ciudadanía), CE (Cédula de Extranjería), etc.
2. **Número de documento**: Documento de identidad del pagador
3. **Código del banco**: ID de la institución financiera seleccionada
4. **Tipo de persona**: natural o jurídica

#### Creación de Pago PSE
```javascript
// Estructura del pago PSE
POST https://api.mercadopago.com/v1/payments

{
  "transaction_amount": 100,
  "payment_method_id": "pse",
  "payer": {
    "email": "user@example.com",
    "identification": {
      "type": "CC",
      "number": "12345678"
    },
    "entity_type": "individual"
  },
  "additional_info": {
    "ip_address": "127.0.0.1"
  },
  "callback_url": "https://www.your-site.com/process_payment",
  "notification_url": "https://www.your-site.com/webhooks/mercadopago"
}
```

### 1.3 Flujo de Pago PSE
1. **Selección de banco**: Usuario elige su banco de la lista de instituciones financieras
2. **Ingreso de datos**: Usuario proporciona tipo y número de documento
3. **Redirección**: Usuario es redirigido al portal del banco
4. **Autenticación**: Usuario se autentica en el portal bancario
5. **Autorización**: Usuario autoriza la transferencia
6. **Confirmación**: Retorno a la tienda con resultado del pago

### 1.4 Estados de Pago PSE
- **pending**: Pago pendiente de procesamiento
- **approved**: Pago aprobado
- **rejected**: Pago rechazado
- **cancelled**: Pago cancelado por el usuario

## 2. Documentación de MedusaJS - Payment Providers

### 2.1 Arquitectura de Payment Providers

#### Estructura de Payment Provider
```typescript
class AbstractPaymentProvider {
  // Métodos requeridos
  async initiatePayment(input: InitiatePaymentInput): Promise<PaymentProviderError | PaymentProviderSessionResponse>
  async authorizePayment(input: AuthorizePaymentInput): Promise<PaymentProviderError | PaymentProviderSessionResponse>
  async capturePayment(input: CapturePaymentInput): Promise<PaymentProviderError | PaymentProviderSessionResponse>
  async refundPayment(input: RefundPaymentInput): Promise<PaymentProviderError | PaymentProviderSessionResponse>
  async getWebhookActionAndData(payload: ProviderWebhookPayload): Promise<WebhookActionResult>
}
```

### 2.2 Sistema de Webhooks en MedusaJS

#### Ruta de Webhook Estándar
```
POST /hooks/payment/{identifier}_{provider}
```

#### Implementación de getWebhookActionAndData
```typescript
async getWebhookActionAndData(
  payload: ProviderWebhookPayload["payload"]
): Promise<WebhookActionResult> {
  const { data, rawData, headers } = payload

  switch(data.event_type) {
    case "authorized_amount":
      return {
        action: "authorized",
        data: {
          session_id: data.metadata.session_id,
          amount: new BigNumber(data.amount)
        }
      }
    case "success":
      return {
        action: "captured",
        data: {
          session_id: data.metadata.session_id,
          amount: new BigNumber(data.amount)
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
}
```

### 2.3 Configuración de Payment Module
```typescript
// medusa-config.ts
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
        ],
      },
    },
  ],
})
```

## 3. Análisis del Plugin Actual

### 3.1 Plugin Instalado
- **Nombre**: `@nicogorga/medusa-payment-mercadopago`
- **Versión**: `^0.2.5`
- **Estado**: Configurado y funcional para pagos básicos

### 3.2 Limitaciones Identificadas
1. **Soporte PSE**: No hay evidencia de soporte específico para PSE
2. **Instituciones Financieras**: No hay endpoint para obtener bancos PSE
3. **Validación de Documentos**: No hay validación específica para documentos colombianos
4. **Flujo de Redirección**: No hay manejo específico del flujo PSE

## 4. Requisitos Técnicos Identificados

### 4.1 Backend Requirements
1. **Endpoint de Instituciones Financieras**
   ```typescript
   GET /store/pse/financial-institutions
   ```

2. **Endpoint de Validación PSE**
   ```typescript
   POST /store/pse/validate
   ```

3. **Webhook Específico PSE**
   ```typescript
   POST /hooks/payment/mercadopago-pse_mercadopago
   ```

### 4.2 Frontend Requirements
1. **Formulario PSE**: Captura de tipo de documento, número y selección de banco
2. **Lista de Bancos**: Componente para mostrar instituciones financieras
3. **Estados de Pago**: Manejo de estados pending, approved, rejected
4. **Redirección**: Manejo del flujo de redirección al banco

### 4.3 Seguridad y Compliance
1. **Validación de Datos**: Validación de tipos de documento colombianos
2. **Logging**: Registro detallado de transacciones PSE
3. **Error Handling**: Manejo robusto de errores específicos de PSE
4. **Webhook Security**: Validación de firmas de webhook

## 5. Limitaciones y Consideraciones

### 5.1 Limitaciones del Plugin Actual
- No incluye soporte nativo para PSE
- Requiere extensión o modificación para soportar PSE
- Necesita implementación de endpoints específicos

### 5.2 Consideraciones de Implementación
- **Compatibilidad**: Mantener compatibilidad con el plugin existente
- **Extensibilidad**: Diseñar solución extensible para futuros métodos de pago
- **Performance**: Optimizar llamadas a APIs de Mercado Pago
- **Testing**: Implementar testing exhaustivo en sandbox

### 5.3 Dependencias Externas
- **Mercado Pago API**: Dependencia de la disponibilidad de la API
- **Bancos**: Dependencia de la disponibilidad de los portales bancarios
- **Network**: Requiere conectividad estable para redirecciones

## 6. Próximos Pasos

1. **Verificar Soporte PSE**: Confirmar si el plugin actual puede extenderse para PSE
2. **Implementar Endpoints**: Crear endpoints específicos para PSE
3. **Desarrollar Frontend**: Implementar componentes de UI para PSE
4. **Testing**: Configurar entorno de pruebas con sandbox de Mercado Pago
5. **Documentación**: Crear documentación específica para PSE

---

**Fecha de Investigación**: Enero 2025  
**Estado**: Investigación Completada  
**Próximo Paso**: Configuración del Backend