# Implementación Técnica Detallada - PSE con Mercado Pago

## 🎯 Objetivo
Guía técnica paso a paso para implementar pagos PSE en Cool Bordados extendiendo el plugin existente de Mercado Pago.

## ✅ Estado Verificado

### Conectividad API ✅
- **Token de acceso**: Configurado y funcionando
- **API Response**: PSE disponible y activo
- **Payment Type**: `bank_transfer` ✅
- **Status**: `active` ✅

### Infraestructura Existente ✅
- **Plugin**: `@nicogorga/medusa-payment-mercadopago@0.2.5`
- **SDK**: `mercadopago@2.9.0` (v2.x - Perfecto para PSE)
- **Webhooks**: Configurados
- **MedusaJS**: Integración completa

## 🛠 Implementación Backend

### 1. Extensión del Provider Existente

#### Archivo: `src/providers/mercadopago-provider.ts` (Extensión)

```typescript
import { MercadoPagoConfig, Payment } from 'mercadopago';

export class MercadoPagoProviderService extends AbstractPaymentProcessor {
  // ... código existente ...

  async authorizePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    const { payment_method_id } = context.paymentSessionData;
    
    // Manejar PSE
    if (payment_method_id === 'pse') {
      return this.handlePSEPayment(context);
    }
    
    // Código existente para tarjetas
    return this.handleCardPayment(context);
  }

  private async handlePSEPayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorSessionResponse> {
    const payment = new Payment(this.client);
    
    const body = {
      transaction_amount: context.amount / 100, // Convertir de centavos
      payment_method_id: 'pse',
      payer: {
        email: context.email,
        entity_type: context.paymentSessionData.entity_type || 'individual',
        identification: {
          type: context.paymentSessionData.identification_type,
          number: context.paymentSessionData.identification_number
        }
      },
      transaction_details: {
        financial_institution: context.paymentSessionData.financial_institution
      },
      callback_url: `${this.options.callback_url}/pse/return`,
      notification_url: `${this.options.webhook_url}/webhooks/mercadopago`,
      external_reference: context.resource_id,
      description: `Pago Cool Bordados - Orden ${context.resource_id}`
    };

    try {
      const response = await payment.create({ body });
      
      return {
        session_data: {
          id: response.id,
          status: response.status,
          redirect_url: response.transaction_details?.external_resource_url,
          payment_method_id: 'pse',
          financial_institution: body.transaction_details.financial_institution
        }
      };
    } catch (error) {
      throw new Error(`PSE Payment failed: ${error.message}`);
    }
  }

  // Extender webhook handler para PSE
  async getWebhookActionAndData(data: {
    data: { id: string };
    type: string;
  }): Promise<WebhookActionResult> {
    const { id } = data.data;
    const payment = new Payment(this.client);
    
    try {
      const paymentData = await payment.get({ id });
      
      // Manejar estados específicos de PSE
      if (paymentData.payment_method_id === 'pse') {
        return this.handlePSEWebhook(paymentData);
      }
      
      // Código existente para tarjetas
      return this.handleCardWebhook(paymentData);
    } catch (error) {
      return { action: 'not_supported' };
    }
  }

  private handlePSEWebhook(paymentData: any): WebhookActionResult {
    const status = paymentData.status;
    
    switch (status) {
      case 'pending':
        return {
          action: 'authorized',
          data: {
            session_id: paymentData.id,
            amount: paymentData.transaction_amount * 100
          }
        };
      
      case 'approved':
        return {
          action: 'captured',
          data: {
            session_id: paymentData.id,
            amount: paymentData.transaction_amount * 100
          }
        };
      
      case 'rejected':
      case 'cancelled':
        return {
          action: 'failed',
          data: {
            session_id: paymentData.id,
            amount: paymentData.transaction_amount * 100
          }
        };
      
      default:
        return { action: 'not_supported' };
    }
  }

  // Método para obtener bancos PSE
  async getPSEBanks(): Promise<any[]> {
    try {
      const response = await fetch(
        'https://api.mercadopago.com/v1/payment_methods/pse/financial_institutions',
        {
          headers: {
            'Authorization': `Bearer ${this.options.access_token}`
          }
        }
      );
      
      const data = await response.json();
      return data.financial_institutions || [];
    } catch (error) {
      console.error('Error fetching PSE banks:', error);
      return [];
    }
  }
}
```

### 2. Endpoint para Bancos PSE

#### Archivo: `src/api/store/pse/route.ts` (Nuevo)

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { MercadoPagoProviderService } from "../../../providers/mercadopago-provider";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const paymentProviderService = req.scope.resolve("pp_mercadopago") as MercadoPagoProviderService;
  
  try {
    const banks = await paymentProviderService.getPSEBanks();
    res.json({ banks });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch PSE banks" });
  }
}
```

### 3. Endpoint de Retorno PSE

#### Archivo: `src/api/store/pse/return/route.ts` (Nuevo)

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { payment_id, status, external_reference } = req.query;
  
  // Redirigir al frontend con los parámetros
  const frontendUrl = process.env.STORE_URL || 'http://localhost:8000';
  const redirectUrl = `${frontendUrl}/checkout/pse/result?payment_id=${payment_id}&status=${status}&order_id=${external_reference}`;
  
  res.redirect(redirectUrl);
}
```

## 🎨 Implementación Frontend

### 1. Instalación del SDK Frontend

```bash
npm install @mercadopago/sdk-js
```

### 2. Componente Payment Brick

#### Archivo: `src/components/checkout/PSEPayment.tsx` (Nuevo)

```tsx
import React, { useEffect, useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';

interface PSEPaymentProps {
  amount: number;
  onPaymentSubmit: (paymentData: any) => void;
  onError: (error: any) => void;
}

export const PSEPayment: React.FC<PSEPaymentProps> = ({
  amount,
  onPaymentSubmit,
  onError
}) => {
  const [mp, setMp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeMercadoPago = async () => {
      try {
        await loadMercadoPago();
        const mercadopago = new window.MercadoPago(
          process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
          { locale: 'es-CO' }
        );
        setMp(mercadopago);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading MercadoPago:', error);
        onError(error);
      }
    };

    initializeMercadoPago();
  }, []);

  useEffect(() => {
    if (mp && !isLoading) {
      const bricksBuilder = mp.bricks();
      
      const renderPaymentBrick = async () => {
        const settings = {
          initialization: {
            amount: amount / 100, // Convertir de centavos
            preferenceId: null,
          },
          customization: {
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              bankTransfer: "all", // Incluye PSE
            },
            visual: {
              style: {
                theme: 'default'
              }
            }
          },
          callbacks: {
            onSubmit: async (formData: any) => {
              try {
                // Agregar datos específicos para PSE
                if (formData.payment_method_id === 'pse') {
                  formData.entity_type = 'individual';
                  formData.callback_url = `${window.location.origin}/checkout/pse/result`;
                }
                
                await onPaymentSubmit(formData);
              } catch (error) {
                onError(error);
              }
            },
            onReady: () => {
              console.log('Payment Brick ready');
            },
            onError: (error: any) => {
              console.error('Payment Brick error:', error);
              onError(error);
            }
          }
        };

        try {
          await bricksBuilder.create('payment', 'payment-brick-container', settings);
        } catch (error) {
          console.error('Error creating Payment Brick:', error);
          onError(error);
        }
      };

      renderPaymentBrick();
    }
  }, [mp, isLoading, amount, onPaymentSubmit, onError]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando métodos de pago...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id="payment-brick-container" className="w-full"></div>
    </div>
  );
};
```

### 3. Integración en Checkout

#### Archivo: `src/components/checkout/CheckoutForm.tsx` (Modificación)

```tsx
import { PSEPayment } from './PSEPayment';

export const CheckoutForm = () => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  
  const handlePSEPayment = async (paymentData: any) => {
    try {
      // Crear sesión de pago en MedusaJS
      const response = await fetch('/store/payment-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_id: 'mercadopago',
          data: paymentData
        })
      });

      const result = await response.json();

      // Si es PSE, redirigir al banco
      if (result.session_data?.redirect_url) {
        window.location.href = result.session_data.redirect_url;
      }
    } catch (error) {
      console.error('Error processing PSE payment:', error);
      // Manejar error
    }
  };

  return (
    <div className="checkout-form">
      {/* Selector de método de pago */}
      <div className="payment-method-selector">
        <button 
          onClick={() => setSelectedPaymentMethod('card')}
          className={selectedPaymentMethod === 'card' ? 'active' : ''}
        >
          Tarjeta de Crédito/Débito
        </button>
        <button 
          onClick={() => setSelectedPaymentMethod('pse')}
          className={selectedPaymentMethod === 'pse' ? 'active' : ''}
        >
          PSE - Débito a Cuentas
        </button>
      </div>

      {/* Renderizar componente según selección */}
      {selectedPaymentMethod === 'pse' && (
        <PSEPayment
          amount={cart.total}
          onPaymentSubmit={handlePSEPayment}
          onError={(error) => console.error('PSE Error:', error)}
        />
      )}
      
      {selectedPaymentMethod === 'card' && (
        // Componente existente para tarjetas
        <CardPayment />
      )}
    </div>
  );
};
```

### 4. Página de Resultado PSE

#### Archivo: `src/pages/checkout/pse/result.tsx` (Nuevo)

```tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function PSEResult() {
  const router = useRouter();
  const { payment_id, status, order_id } = router.query;
  const [paymentStatus, setPaymentStatus] = useState('loading');

  useEffect(() => {
    if (payment_id && status) {
      // Verificar estado del pago
      checkPaymentStatus(payment_id as string);
    }
  }, [payment_id, status]);

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`);
      const data = await response.json();
      setPaymentStatus(data.status);
      
      // Redirigir según el estado
      setTimeout(() => {
        if (data.status === 'approved') {
          router.push(`/order/confirmed/${order_id}`);
        } else {
          router.push('/checkout?error=payment_failed');
        }
      }, 3000);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'loading':
        return 'Verificando el estado de tu pago...';
      case 'approved':
        return '¡Pago exitoso! Redirigiendo...';
      case 'pending':
        return 'Tu pago está siendo procesado...';
      case 'rejected':
        return 'El pago fue rechazado. Intenta nuevamente.';
      default:
        return 'Verificando el estado de tu pago...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          {paymentStatus === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {paymentStatus === 'approved' && (
            <div className="text-green-500 text-5xl">✓</div>
          )}
          {paymentStatus === 'rejected' && (
            <div className="text-red-500 text-5xl">✗</div>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-2">
          {getStatusMessage()}
        </h2>
        
        <p className="text-gray-600 mb-4">
          ID de Pago: {payment_id}
        </p>
        
        {paymentStatus === 'rejected' && (
          <button
            onClick={() => router.push('/checkout')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Intentar Nuevamente
          </button>
        )}
      </div>
    </div>
  );
}
```

## 🧪 Testing

### 1. Test de Integración Backend

```javascript
// tests/pse-integration.test.js
const { MercadoPagoProviderService } = require('../src/providers/mercadopago-provider');

describe('PSE Integration', () => {
  let provider;

  beforeEach(() => {
    provider = new MercadoPagoProviderService({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
      webhook_secret: process.env.MERCADOPAGO_WEBHOOK_SECRET
    });
  });

  test('should create PSE payment', async () => {
    const context = {
      amount: 10000, // $100.00
      email: 'test@coolbordados.com',
      resource_id: 'order_123',
      paymentSessionData: {
        payment_method_id: 'pse',
        entity_type: 'individual',
        identification_type: 'CC',
        identification_number: '12345678',
        financial_institution: '1007' // Bancolombia
      }
    };

    const result = await provider.authorizePayment(context);
    
    expect(result.session_data.id).toBeDefined();
    expect(result.session_data.redirect_url).toBeDefined();
    expect(result.session_data.payment_method_id).toBe('pse');
  });

  test('should fetch PSE banks', async () => {
    const banks = await provider.getPSEBanks();
    
    expect(Array.isArray(banks)).toBe(true);
    expect(banks.length).toBeGreaterThan(0);
    expect(banks[0]).toHaveProperty('id');
    expect(banks[0]).toHaveProperty('description');
  });
});
```

### 2. Test de Datos PSE

```javascript
// Datos de prueba para PSE
const PSE_TEST_DATA = {
  entity_type: 'individual',
  identification_type: 'CC',
  identification_number: '12345678',
  financial_institution: '1007', // Bancolombia
  email: 'test@coolbordados.com'
};

// Bancos de prueba más comunes
const COMMON_BANKS = [
  { id: '1007', name: 'Bancolombia' },
  { id: '1001', name: 'Banco de Bogotá' },
  { id: '1002', name: 'Banco Popular' },
  { id: '1006', name: 'Banco Itaú' },
  { id: '1013', name: 'BBVA' }
];
```

## 📋 Checklist de Implementación

### Backend ✅
- [ ] Extender provider para soportar PSE
- [ ] Implementar `handlePSEPayment`
- [ ] Actualizar webhook handler
- [ ] Crear endpoint para bancos PSE
- [ ] Crear endpoint de retorno
- [ ] Testing unitario

### Frontend ✅
- [ ] Instalar `@mercadopago/sdk-js`
- [ ] Crear componente `PSEPayment`
- [ ] Integrar Payment Brick
- [ ] Crear página de resultado
- [ ] Actualizar checkout flow
- [ ] Testing de integración

### Configuración ✅
- [ ] Variables de entorno configuradas
- [ ] URLs de callback actualizadas
- [ ] CORS configurado para Mercado Pago
- [ ] Webhooks funcionando

### Testing ✅
- [ ] Test con datos de prueba
- [ ] Validar redirecciones
- [ ] Verificar webhooks
- [ ] Test de diferentes bancos
- [ ] Test de estados de pago

## 🚀 Deployment

### Variables de Entorno Adicionales
```bash
# Frontend
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key

# Backend (ya configuradas)
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret
```

### Configuración de Producción
1. Cambiar tokens de TEST a PROD
2. Actualizar URLs de callback
3. Configurar webhooks en producción
4. Validar certificados SSL

---

**Nota**: Esta implementación aprovecha al máximo la infraestructura existente, minimizando el código custom y maximizando la confiabilidad usando los SDKs oficiales de Mercado Pago.