# Configuración de MercadoPago en MedusaJS

## ✅ Instalación Completada

Se ha instalado y configurado exitosamente el plugin `@nicogorga/medusa-payment-mercadopago` en tu proyecto MedusaJS.

## Pasos Realizados

### 1. ✅ Instalación del Plugin
```bash
npm install @nicogorga/medusa-payment-mercadopago --legacy-peer-deps
```

### 2. ✅ Variables de Entorno
Se agregaron las siguientes variables al archivo `.env.template`:
```env
# MercadoPago Configuration
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. ✅ Configuración de MedusaJS
Se actualizó `medusa-config.ts` con:
- Plugin de MercadoPago en la sección `plugins`
- Proveedor de pago en la sección `modules`

## Próximos Pasos Requeridos

### 1. 🔧 Configurar Variables de Entorno Reales
Necesitas crear un archivo `.env` (basado en `.env.template`) y configurar:

1. **Crear cuenta de desarrollador en MercadoPago**:
   - Ve a https://developers.mercadopago.com/
   - Crea una nueva aplicación
   - Selecciona "Pagos Online" → "Otras plataformas" → "Checkout API"

2. **Obtener credenciales**:
   - Copia el `Access Token` de prueba
   - Reemplaza `your_access_token_here` en tu archivo `.env`

3. **Configurar webhook secret** (opcional pero recomendado):
   - Genera un webhook secret en tu aplicación MercadoPago
   - Reemplaza `your_webhook_secret_here` en tu archivo `.env`

### 2. 🌐 Configurar Webhooks para Desarrollo Local

Para probar webhooks localmente necesitarás **ngrok**:

```bash
# Instalar ngrok si no lo tienes
brew install ngrok

# En una terminal, ejecutar tu servidor Medusa
npm run dev

# En otra terminal, exponer el puerto 9000
ngrok http 9000

# Configurar webhook en MercadoPago con la URL:
# [ngrok URL]/hooks/payment/mercadopago_mercadopago
```

### 3. 🛒 Configurar Frontend (Storefront)

El plugin requiere integración con **Payment Brick** de MercadoPago en el frontend. Puedes usar el storefront de ejemplo:

```bash
git clone https://github.com/NicolasGorga/medusa-payment-mercadopago-storefront
```

O integrar Payment Brick en tu storefront existente con:
```env
NEXT_PUBLIC_MP_PUBLIC_KEY=your_public_key_here
```

## Verificación

Para verificar que todo funciona correctamente:

1. Ejecuta `npm run dev`
2. Verifica que no hay errores en la consola
3. El proveedor "mercadopago" debería aparecer en los métodos de pago disponibles

## Documentación Adicional

- [Plugin NPM](https://www.npmjs.com/package/@nicogorga/medusa-payment-mercadopago)
- [Storefront de Ejemplo](https://github.com/NicolasGorga/medusa-payment-mercadopago-storefront)
- [Documentación MercadoPago](https://www.mercadopago.com/developers)

## Notas Importantes

- Este plugin está en desarrollo activo
- Actualmente probado principalmente con tarjetas de crédito/débito
- Requiere MedusaJS v2
- Se instaló con `--legacy-peer-deps` debido a conflictos de versiones