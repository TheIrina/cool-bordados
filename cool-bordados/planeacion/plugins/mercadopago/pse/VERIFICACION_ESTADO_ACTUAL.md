# Verificación del Estado Actual - Pagos Mercado Pago

## 🎯 Objetivo
Verificar que el estado actual de los pagos básicos con Mercado Pago funcione correctamente antes de proceder con la implementación de PSE.

## ✅ Estado Actual Verificado

### Plugin y Dependencias
- **Plugin**: `@nicogorga/medusa-payment-mercadopago@0.2.5` ✅ Instalado
- **SDK Backend**: `mercadopago@2.9.0` ✅ Versión 2.x (Excelente!)
- **Configuración**: Presente en `medusa-config.ts` ✅

### Configuración Actual
```typescript
// medusa-config.ts
{
  resolve: "@nicogorga/medusa-payment-mercadopago",
  options: {
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
    webhook_secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    // Otras configuraciones...
  }
}
```

## 🔍 Checklist de Verificación

### 1. Configuración de Credenciales
- [ ] **Variables de entorno configuradas**
  - `MERCADOPAGO_ACCESS_TOKEN` (sandbox/production)
  - `MERCADOPAGO_WEBHOOK_SECRET`
  - Verificar en `.env` o variables del sistema

### 2. Funcionalidad Básica de Pagos
- [ ] **Crear pago con tarjeta de crédito**
  - Probar con tarjeta de prueba: `4509 9535 6623 3704`
  - Verificar respuesta exitosa
  - Confirmar creación en dashboard de Mercado Pago

- [ ] **Webhooks funcionando**
  - Verificar endpoint `/webhooks/mercadopago` accesible
  - Probar notificación de pago
  - Validar firma de webhook

- [ ] **Estados de pago**
  - Verificar transición: `pending` → `approved`
  - Confirmar actualización en MedusaJS
  - Validar orden completada

### 3. Integración con MedusaJS
- [ ] **Payment Provider registrado**
  - Verificar en admin: Settings → Payment Providers
  - Confirmar "mercadopago" disponible
  - Validar configuración regional

- [ ] **Checkout funcionando**
  - Probar flujo completo de checkout
  - Verificar selección de método de pago
  - Confirmar procesamiento exitoso

## 🧪 Scripts de Verificación

### Script 1: Verificar Credenciales
```bash
# Verificar variables de entorno
echo "MERCADOPAGO_ACCESS_TOKEN: ${MERCADOPAGO_ACCESS_TOKEN:0:10}..."
echo "MERCADOPAGO_WEBHOOK_SECRET: ${MERCADOPAGO_WEBHOOK_SECRET:0:10}..."

# Verificar conectividad con API
curl -X GET \
  'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer '$MERCADOPAGO_ACCESS_TOKEN
```

### Script 2: Test de Pago Básico
```javascript
// test-basic-payment.js
const { MercadoPagoConfig, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});
const payment = new Payment(client);

async function testBasicPayment() {
  try {
    const body = {
      transaction_amount: 100,
      token: 'card_token_example', // Token de tarjeta de prueba
      description: 'Test payment - Cool Bordados',
      installments: 1,
      payment_method_id: 'visa',
      payer: {
        email: 'test@coolbordados.com'
      }
    };

    const response = await payment.create({ body });
    console.log('✅ Pago creado exitosamente:', response.id);
    console.log('Estado:', response.status);
    return response;
  } catch (error) {
    console.error('❌ Error en pago:', error);
    throw error;
  }
}

testBasicPayment();
```

### Script 3: Verificar Webhook
```javascript
// test-webhook.js
const crypto = require('crypto');

function validateWebhookSignature(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}

// Test con datos de ejemplo
const testBody = '{"id":123456789,"live_mode":false,"type":"payment","date_created":"2024-01-01T00:00:00Z","application_id":123456789,"user_id":123456789,"version":1,"api_version":"v1","action":"payment.created","data":{"id":"123456789"}}';
const testSignature = 'expected_signature_here';
const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

console.log('✅ Webhook signature valid:', validateWebhookSignature(testBody, testSignature, webhookSecret));
```

## 📋 Resultados de Verificación

### ✅ Elementos Funcionando
- [ ] Plugin instalado y configurado
- [ ] SDK v2.x disponible (excelente base para PSE)
- [ ] Infraestructura de webhooks implementada
- [ ] Manejo de estados de pago
- [ ] Integración con MedusaJS

### ⚠️ Elementos a Verificar
- [ ] Credenciales de sandbox/producción
- [ ] Conectividad con API de Mercado Pago
- [ ] Funcionamiento de webhooks
- [ ] Flujo completo de checkout

### ❌ Problemas Identificados
- [ ] [Documentar cualquier problema encontrado]
- [ ] [Incluir pasos para resolución]

## 🔧 Comandos de Verificación Rápida

```bash
# 1. Verificar instalación del plugin
npm list @nicogorga/medusa-payment-mercadopago

# 2. Verificar SDK de Mercado Pago
npm list mercadopago

# 3. Verificar configuración en MedusaJS
grep -r "mercadopago" medusa-config.ts

# 4. Verificar variables de entorno
env | grep MERCADOPAGO

# 5. Probar conectividad con API
curl -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN" \
     https://api.mercadopago.com/v1/payment_methods
```

## 📊 Métricas de Salud del Sistema

### Antes de Implementar PSE
- [ ] **Tasa de éxito de pagos**: > 95%
- [ ] **Tiempo de respuesta**: < 3 segundos
- [ ] **Webhooks entregados**: > 99%
- [ ] **Errores de configuración**: 0

### Indicadores de Problemas
- ❌ Pagos fallando consistentemente
- ❌ Webhooks no llegando
- ❌ Timeouts en API calls
- ❌ Errores de autenticación

## 🚀 Próximos Pasos

### Si Todo Funciona ✅
1. Proceder con implementación de PSE según plan optimizado
2. Usar la infraestructura existente como base
3. Extender funcionalidades sin romper lo actual

### Si Hay Problemas ❌
1. Resolver problemas básicos primero
2. Estabilizar pagos con tarjetas
3. Luego proceder con PSE

## 📞 Soporte y Recursos

- **Documentación del Plugin**: [GitHub del plugin](https://github.com/nicogorga/medusa-payment-mercadopago)
- **API de Mercado Pago**: https://developers.mercadopago.com/
- **Soporte MedusaJS**: https://docs.medusajs.com/
- **Dashboard Mercado Pago**: https://mercadopago.com/developers/

---

**Nota**: Esta verificación es crucial antes de implementar PSE. Un sistema base estable garantiza una implementación exitosa de nuevas funcionalidades.