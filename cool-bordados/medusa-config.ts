import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    // Configuración del panel de administración para acceso externo
    backendUrl: process.env.MEDUSA_BACKEND_URL || "https://medusa.irinacloud.co/",
    path: "/app",
    vite: () => {
      return {
        server: {
          allowedHosts: ["cool.irinacloud.co", "medusa.irinacloud.co"],
        },
      }
    },
  },
  plugins: [
    {
      resolve: `@nicogorga/medusa-payment-mercadopago`,
      options: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      },
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "static",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@nicogorga/medusa-payment-mercadopago/providers/mercado-pago",
            id: "mercadopago",
            options: {
              accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
              webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
  ],
})
