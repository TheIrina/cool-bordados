<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Mejor Forma de Integrar MercadoPago con MedusaJS

La integración de MercadoPago con MedusaJS es esencial para ecommerce en Latinoamérica, ya que permite aceptar pagos en monedas locales y ofrecer métodos de pago populares en la región. Basándome en la investigación actual, **la mejor opción disponible es usar el plugin `@nicogorga/medusa-payment-mercadopago`** que está específicamente desarrollado para MedusaJS v2.[^1][^2]

## Plugin Recomendado: @nicogorga/medusa-payment-mercadopago

Este es el plugin más actualizado y activamente mantenido para la integración de MercadoPago con MedusaJS v2. Fue desarrollado por Nicolás Gorga y representa la mejor opción disponible actualmente.[^2][^1]

### Características Principales

- **Integración vía Checkout API** de MercadoPago[^1]
- **Pagos asíncronos** procesados mediante webhooks[^1]
- **Captura automática** de pagos (especialmente para tarjetas de crédito/débito)[^1]
- **Guardado automático** de clientes y tarjetas en MercadoPago para implementar tarjetas guardadas[^1]
- **Compatibilidad** con MedusaJS v2[^1]


### Prerequisitos Técnicos

- **Node.js v20 o superior**[^1]
- **Backend de Medusa** funcionando[^1]
- **Cuenta de desarrollador** en MercadoPago[^1]
- **ngrok** para pruebas locales (exponer localhost)[^1]
- **Frontend** que integre Payment Brick de MercadoPago[^1]


## Guía de Instalación Paso a Paso

### 1. Instalación del Plugin

```bash
npm install @nicogorga/medusa-payment-mercadopago
```


### 2. Configuración de Variables de Entorno

Agrega las siguientes variables en tu archivo `.env`:[^1]

```env
# Token de acceso disponible en la sección Test Credentials de tu aplicación MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here

# (Opcional pero recomendado) Webhook secret disponible en la sección Webhooks de tu aplicación MercadoPago  
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret_here
```


### 3. Configuración en medusa-config.ts

**Configuración de Plugins:**

```typescript
projectConfig: {
  plugins: [
    // ... otros plugins
    {
      resolve: `@nicogorga/medusa-payment-mercadopago`,
      options: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      },
    },
  ]
}
```

**Configuración de Módulos:**

```typescript
modules: [
  {
    resolve: '@medusajs/medusa/payment',
    options: {
      providers: [
        {
          resolve: '@nicogorga/medusa-payment-mercadopago/providers/mercado-pago',
          id: 'mercadopago',
          options: {
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
            webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
          },
          dependencies: [
            ContainerRegistrationKeys.LOGGER
          ]
        }
      ],
    }
  }
]
```


## Configuración de MercadoPago

### 1. Creación de Aplicación en MercadoPago

1. **Accede** a tu cuenta de desarrollador de MercadoPago[^1]
2. **Crea una nueva aplicación**[^1]
3. **Selecciona** "Pagos Online" como tipo de solución[^1]
4. **Responde** "Sí" a la pregunta sobre plataforma de ecommerce y selecciona "Otras plataformas"[^1]
5. **Selecciona** "Checkout API" como producto a integrar[^1]

### 2. Obtención de Credenciales

- **Genera credenciales de prueba** y opcionalmente, credenciales de producción[^1]
- **Copia** el Access Token y Public Key para usar en tu configuración[^1]


### 3. Configuración de Webhooks

**Para desarrollo local con ngrok:**

1. **Ejecuta** tu backend de Medusa: `yarn dev`[^1]
2. **En terminal separada**, ejecuta: `ngrok http 9000`[^1]
3. **Copia la URL generada** por ngrok[^1]
4. **Configura el webhook** en MercadoPago con la URL: `[ngrok URL]/hooks/payment/mercadopago_mercadopago`[^1]
5. **Selecciona** el evento "Pagos" en la configuración[^1]
6. **Genera un webhook secret** (opcional pero recomendado para seguridad)[^1]

## Configuración del Frontend

### Instalación de SDK para React

Para el frontend necesitarás integrar el **Payment Brick** de MercadoPago. El desarrollador del plugin recomienda usar su storefront de ejemplo como base:[^3]

```bash
git clone https://github.com/NicolasGorga/medusa-payment-mercadopago-storefront
cd medusa-payment-mercadopago-storefront
yarn install
```


### Variables de Entorno del Frontend

Configura en tu `.env.local`:[^3]

```env
NEXT_PUBLIC_MP_PUBLIC_KEY=your_public_key_here
```


## Alternativas Disponibles

### Plugin de MinSkyLab (@minskylab/medusa-payment-mercadopago)

Este fue uno de los primeros plugins disponibles, pero **no está siendo mantenido activamente**. Aunque funcionaba en versiones anteriores de MedusaJS, puede requerir adaptaciones para MedusaJS v2.[^4][^5]

### Plugin de Marcos Gomes (@marcosgn/medusa-payment-mercadopago)

Esta opción soporta **Transparent Checkout** y métodos de pago brasileños como PIX, pero actualmente solo es compatible con MedusaJS v1 y los desarrolladores han anunciado que "pronto lanzarán la versión compatible con Medusa 2.0".[^6]

## Mejores Prácticas y Recomendaciones

### 1. Seguridad

- **Siempre usa webhook secrets** para validar las notificaciones de MercadoPago[^1]
- **Implementa validación** de firmas en los webhooks para mayor seguridad[^1]
- **Separa** las credenciales de prueba y producción[^1]


### 2. Testing

- **Usa las tarjetas de prueba** proporcionadas por MercadoPago[^7]
- **Crea usuarios de prueba** tanto comprador como vendedor[^7]
- **Prueba diferentes escenarios** como pagos rechazados y aprobados[^7]


### 3. Monitoreo

- **Implementa logs** para rastrear transacciones[^1]
- **Configura alertas** para fallos en webhooks[^1]
- **Monitorea** el estado de los pagos en tiempo real[^1]


### 4. Consideraciones de Desarrollo

Según los desarrolladores experimentados de la comunidad, la integración de MercadoPago con MedusaJS requiere **más esfuerzo del desarrollador** comparado con plataformas más maduras, ya que hay menos integraciones disponibles y algunas pueden necesitar adaptaciones.[^5]

## Limitaciones Actuales

### Plugin @nicogorga/medusa-payment-mercadopago

- **Solo probado** con métodos de tarjeta de crédito/débito siguiendo la documentación de MercadoPago para Uruguay[^2][^1]
- **Trabajo en progreso** - el desarrollador indica que aún está en desarrollo[^2][^1]
- **Soporte limitado** para otros métodos de pago populares en Latinoamérica[^1]


### Estado del Ecosistema

- **Menor cantidad de plugins** disponibles comparado con otras plataformas de ecommerce[^5]
- **Documentación limitada** en español[^5]
- **Comunidad pequeña** pero activa de desarrolladores[^8][^9]


## Conclusión

La integración de MercadoPago con MedusaJS es definitivamente posible y **`@nicogorga/medusa-payment-mercadopago` es actualmente la mejor opción disponible**. Aunque el plugin está en desarrollo continuo, ofrece una base sólida para implementar pagos con MercadoPago en aplicaciones MedusaJS v2.[^1]

Para proyectos en producción, recomiendo realizar pruebas exhaustivas y considerar contribuir al desarrollo del plugin para mejorar su funcionalidad y estabilidad. La comunidad de MedusaJS en Latinoamérica está creciendo y hay oportunidades significativas para colaboración en el desarrollo de mejores integraciones.[^9][^8]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32]</span>

<div align="center">⁂</div>

[^1]: https://www.npmjs.com/package/@nicogorga/medusa-payment-mercadopago

[^2]: https://www.npmjs.com/package/@nicogorga/medusa-payment-mercadopago/v/0.2.2

[^3]: https://github.com/NicolasGorga/medusa-payment-mercadopago-storefront

[^4]: https://medusajs.com/integrations/@minskylabmedusa-payment-mercadopago/

[^5]: https://www.youtube.com/watch?v=5KBUfT3768Y

[^6]: https://github.com/marcosgomesneto/medusa-payment-mercadopago

[^7]: https://www.reddit.com/r/devsarg/comments/1joclt0/sandbox_de_prueba_y_usuario_de_prueba_mercado_pago/

[^8]: https://www.linkedin.com/posts/nicolas-gorga-bb9976184_medusa-v2-recently-re-introduced-the-ability-activity-7299612124824190977-BhXn

[^9]: https://es.linkedin.com/posts/jose-rotchen_estuve-probando-medusajs-es-un-set-de-herramientas-activity-7249874281227030529-BBUY

[^10]: https://www.youtube.com/watch?v=BZfHUZ3DDk8

[^11]: https://www.shopify.com/es/blog/mercado-pago-metodos-de-pago

[^12]: https://www.youtube.com/watch?v=pCYpPqGoUqM

[^13]: https://www.npmjs.com/search?q=keywords%3Apayment+provider

[^14]: https://medusajs.com/integrations/

[^15]: https://security.snyk.io/package/npm/@minskylab%2Fmedusa-payment-mercadopago/0.0.1

[^16]: https://www.jsdelivr.com/package/npm/medusa-payment-mercadopago

[^17]: https://www.github-zh.com/projects/567477367-medusa-payment-mercadopago

[^18]: https://forobeta.com/temas/programador-modulo-mercadopago-para-medusajs-v2.1062597/

[^19]: https://www.woohelpdesk.com/blog/how-to-set-up-mercado-pago-payment-plugin-for-woocommerce/

[^20]: https://medusajs.com/integrations/lambdacurry-webhooks/

[^21]: https://www.youtube.com/watch?v=IAsSzmuo6xs

[^22]: https://support.mercately.com/es/articles/10579449-configuracion-de-webhook-de-mercado-pago-para-notificaciones-de-pagos-en-tu-tienda

[^23]: https://soporte.fitcolatam.com/es/articles/6523137-configuracion-de-webhooks-mercado-pago-pasarelas-de-pago

[^24]: https://www.youtube.com/watch?v=Otv0sFh10hw

[^25]: https://www.youtube.com/watch?v=QqiDandkcBY

[^26]: https://github.com/VariableVic/mollie-payments-medusa

[^27]: https://github.com/SGFGOV/medusa-payment-plugins

[^28]: https://docs.medusajs.com/resources/references/payment/provider

[^29]: https://www.npmjs.com/package/@rokmohar/medusa-payment-manual

[^30]: https://tonie.hashnode.dev/implementing-a-custom-payment-gateway-integration-in-medusajs

[^31]: https://docs.medusajs.com/learn/fundamentals/plugins/create

[^32]: https://www.youtube.com/watch?v=dcSOpIzc1Og

