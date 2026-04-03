# 🧠 Plan de Arquitectura AI-First (Feature-Sliced Design + Hooks)

**Fecha de Inicio**: Abril 2026
**Estado**: 🟢 Activo
**Motivo del Pivote Arquitectónico**: Durante las fases iniciales de migración de dependencias (TS 6.0, Babel), descubrimos que la arquitectura actual posee mega-componentes monolíticos (EJ: `payment/index.tsx` con >400 líneas) que acoplan de forma rígida diseño JSX estático con hooks complejos, fetch a la SDK de Medusa y validaciones de negocio. Esta mezcla causa la quema rápida de tokens en el límite del contexto de memoria de sistemas LLM, obligando a usar tipos "any" y bajando la calidad final del código por perder precisión semántica y cohesiva.

> [!NOTE]
> Para futuras IA colaborando en este proyecto: ESTE ES TU PUNTO DE VERDAD. Sigue las fases marcadas para modernizar el frontend hacia un estándar de alta cohesión. **Nunca introduzcas el tipo `any` en lo adelante**.
> *NOTA: Las dependencias UI/Ecosystems se han pausado en `AI_UPDATE_PLAN_PAUSED.md`. No reanudes la Fase 3 de ese documento hasta culminar la Fase C de este plan.*

---

## 🏗️ La Visión Arquitectónica AI-First

Para facilitar que las IAs mantengan este proyecto permanentemente a bajo costo y con cero nivel de estrés o alucinaciones visuales, todos los directorios que actualmente sean abultados deberán ser encapsulados en el framework de **Alta Cohesión (High Cohesion)** o adaptaciones de **Feature-Sliced Design (FSD)**:

1. **`hooks/` (El Cerebro)**: Archivos tipo `use-DOMAIN.ts` donde se aislará exclusivamente toda la lógica imperativa: llamadas a servidor, booleanos de estados derivados o calculados de API, reglas de ciclo de vida.
2. **`ui/` (El Rostro)**: Archivos tipo `DOMAIN-view.tsx` orientados puramente al DOM, que consumen las props renderizadas desde el Cerebro hacia etiquetas HTML5, componentes aislados de estilo puro usando utilidades de Tailwind CSS.
3. **`types/` (El Contrato Legal)**: Modelos fuertemente tipados inferidos desde Zod o interfaces restrictivas de TypeScript exportadas con propósitos reutilizables de UI, abandonando las conjeturas de forma de objetos SDK.
4. **`[index|DOMAIN].tsx` (El Mediador)**: Contenedor Wrapper principal de 10-15 líneas en módulo, se ocupa de ser inyectador entre `hooks` y su respectiva contraparte en `ui`.


---

## 📋 Action Plan: Refactorización por Fases

Sigue el proceso sistemático a continuación. Marca `[ ]` en `[x]` a medida que los componentes migren. 

---

### ✅ Fase A: Módulo Piloto - Proof of Concept (Checkout: Payment)
Demostraremos la viabilidad separando el componente y controlador más pesado del Checkout en un patrón Feature-Sliced.
- [x] **1. Archivos Core & Tipos:** Crear una estructura semántica para `payment` (`src/features/checkout/types/payment.types.ts`).
- [x] **2. Separación de Lógica:** Migrar llamadas a `initiatePaymentSession`, controladores de Stripe/MercadoPago, métodos a `src/features/checkout/hooks/use-payment.ts`.
- [x] **3. UI Estética:** Pasar todo el JSX del radiogroup y contenedores base a `src/features/checkout/ui/payment-view.tsx`.
- [x] **4. Composición Wrapper:** Dejar en `src/modules/checkout/components/payment/index.tsx` solo el puente de los otros dos y probar usando el comando `$ bun run build` junto con navegación visual manual en navegador si procede.

---

### ✅ Fase B: Desacoplamiento de Entidades Grandes
*Migraremos componente por componente de la tienda online guiándonos con el esquema implementado.*
- [x] Refactor Checkout: **Shipping** (`src/modules/checkout/components/shipping`) → `src/features/checkout/{hooks,ui,types}/`
- [x] Refactor Product Details: **Product Actions** (`src/modules/products/components/product-actions/index.tsx`) → `src/features/products/{hooks,ui,types}/`
- [x] Refactor Global: **Cart Dropdown** (`src/modules/layout/components/cart-dropdown/index.tsx`) → `src/features/layout/{hooks,ui,types}/`
- [x] ~~Refactor Filters: **Store Template / Filters**~~ — SKIP: Solo 52 líneas, server component limpio sin `any`. No requiere FSD.
- [x] (Revisión de IA: No se encontraron otros componentes \u003e200 líneas que requieran refactorización).

---

### ✅ Fase C: Zod y Eliminación de "Any" Global (Full Type Safety)
*Auditar todo el código modificado previamente.*
- [x] Auditar e identificar `(cart as any)` dentro de `cart.ts` y similares mutando hacia Types propios enriquecidos o DTOs (Data Transfer Objects).
- [x] Comprobar exhaustivamente la fase mediante `tsc --noEmit`. No se permite seguir a menos que devuelva un código `Ext Code: 0` y no hayan dependencias ambiguas.

---

### ✅ Fase D: Reanudación de Actualizaciones Core
*Terminada toda la infraestructura visual del e-commerce AI-First, reanuda tu enfoque al ecosistema.*
- [x] Abrir el archivo *`AI_UPDATE_PLAN_PAUSED.md`*
- [x] Proceder con la Fase 3: ESlint Configuración.
- [ ] Proceder con la migración al Stripe API v9, atacando directamente solo al enrutador cerebral de `use-payment`.
- [ ] Proceder exhaustivamente a actualizar TailwindCSS v4 de manera global, basándote en la simplicidad de manipular `ui/`.

---

## 📝 Change Log (Diario de Modificaciones de IA)
> Aquí se registrarán los Merge/Commit que avalen la estructura AI First.

- **[2026-04-03]**: Implementación inicial del Pivot Document Arquitectónico para alivianar el coste de tokens para asistentes GPT/LLM en proyectos pesados con Medusa.js.
- **[2026-04-03]**: ✅ Fase A completada. Payment refactorizado de 433→27 líneas (mediador). Creados: `src/features/checkout/types/payment.types.ts`, `hooks/use-payment.ts`, `ui/payment-view.tsx`. Eliminados 7 usos de `any`/`@ts-ignore`, todos los `console.log` de debug. `Window` augmentada para MercadoPago Brick. `ExtendedCart` creada para gift_cards. Verificado con `tsc --noEmit` (exit 0) y `bun run build` (exit 0).
- **[2026-04-03]**: ✅ Fase B completada. Refactorizados 3 componentes: Shipping (409→23 lín, 3 `any` eliminados via `ExtendedShippingOption`), ProductActions (210→24 lín, 1 `any` eliminado), CartDropdown (231→19 lín, ya limpio). StoreTemplate SKIP (52 líneas, server component). Nuevas features: `src/features/checkout/`, `src/features/products/`, `src/features/layout/`. Verificado con `tsc --noEmit` (exit 0) y `bun run build` (exit 0).
- **[2026-04-03]**: ✅ Fase D / Phase 3 completada. ESLint 8.10.0 → 9.39.4 con Flat Config (`eslint.config.mjs`). Prettier 2.8.8 → 3.8.1. `.eslintrc.js` legacy eliminado. Bug `next lint` ("Invalid project directory") resuelto → script usa `eslint .` directo. Añadidos `@eslint/js`, `@eslint/eslintrc`. Nueva Config Flat usa `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` nativos (sin FlatCompat). Regla `@typescript-eslint/no-explicit-any: error` activa via nextTs built-in. 5 tipos `any` adicionales eliminados en `orders.ts`, `billing_address`, `profile-billing-address`, `shipping-address`, `search-modal`. Tipos propios creados: `OrderFilters`, `BillingAddressFormState`, `BillingFormData`, `ShippingFormData`. Scripts añadidos: `lint:fix`, `format`, `format:check`. `bun lint` (16 errores pre-existentes de React hooks, 0 `any`), `tsc --noEmit` (exit 0), `bun run build` (exit 0). Branch: `chore/update-linters`.
