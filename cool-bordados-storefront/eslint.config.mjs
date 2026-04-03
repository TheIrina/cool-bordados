import { defineConfig } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

/**
 * ESLint v9 Flat Config — Cool Bordados Storefront
 *
 * AI_ARCHITECTURE_ROADMAP.md contract:
 * - `@typescript-eslint/no-explicit-any` está en "error" via nextTs (built-in).
 *   Nunca introducir el tipo `any` en este proyecto.
 */
const eslintConfig = defineConfig([
  // Ignorar directorios generados / de build, herramientas y archivos de config JS
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      // Yarn releases — archivos CJS binarios del package manager, no código fuente
      ".yarn/**",
      // Archivos de configuración JS en la raíz (no son código de aplicación)
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "check-env-variables.js",
      "next-sitemap.js",
    ],
  },

  // Next.js Core Web Vitals: react, react-hooks, import, jsx-a11y, @next/next
  ...nextVitals,

  // Next.js TypeScript: @typescript-eslint (includes no-explicit-any: "error")
  ...nextTs,
])

export default eslintConfig
