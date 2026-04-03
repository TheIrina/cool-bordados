# 📦 E-Commerce Modernization & Update Ledger
**Status**: ⏸️ PAUSADO TEMPORALMENTE (Abril 2026)  
> [!WARNING]
> **MOTIVO DE LA PAUSA**: Se ha decidido pausar este plan de actualización de dependencias, ya que identificamos que la estructura monolítica actual del proyecto superará el contexto de las IAs al manejar librerías intrusivas como Tailwind v4 o Stripe v9, aumentando los incidentes de pérdida de memoria y uso de tipos 'any'.
> **NUEVO FOCO:** Nos enfocaremos primero en migrar hacia una Arquitectura AI-First (Feature-Sliced Design + Hooks). Por favor, redirígete y da máxima prioridad a leer el documento -> **[AI_ARCHITECTURE_ROADMAP.md](./AI_ARCHITECTURE_ROADMAP.md)**. Una vez finalizada la arquitectura, se reanudará este plan desde la Fase 3.

**Objective**: Safely update the repository's dependencies to their latest major versions using an isolated, branch-by-branch approach to avoid system-wide regressions.
**For AIs / Assistants**: Use this document as the ground truth for updates... pero ten en cuenta la pausa activa descrita en el banner de arriba.

---

## 🚀 Strategy & Rules
1. **Never update everything at once**: Major version bumps contain breaking changes.
2. **Branching strategy**: Use `feature/update-*` or `chore/update-*` branches. Create a new branch for each phase, fix the breaking changes, verify, and then merge back to `master`.
3. **Verification**: Run build, type checks, and linting after every merge.
4. **Known Issues context**: Be aware that `bun lint` currently fails due to a `package.json` script mapping to `next lint lint` (which throws "Invalid project directory provided"). This needs to be fixed during Phase 3.

---

## 📋 Action Plan

### ✅ Phase 0: Plan Initialization
- [x] Create this AI Update Ledger document to track progress.

### ✅ Phase 1: Vercel & Analytics Tools
*Safest to update, minimal logic changes expected.*
- [x] **Branch**: `chore/update-vercel-tools`
- [x] Update `@vercel/analytics` (`1.6.1` -> `~2.0.1`)
- [x] Update `@vercel/speed-insights` (`1.3.1` -> `~2.0.0`)
- [x] Update `next-devtools-mcp` (`0.2.6` -> `~0.3.10`)
- [x] **Verification**: Ensure no React initialization errors in the Vercel plugin implementations.

### ✅ Phase 2: Typings & Build Tools (TypeScript)
*Medium risk. Might introduce new type errors that need manual adjustment.*
- [x] **Branch**: `chore/update-build-tools`
- [x] Update `@types/node` (`17.0.21` -> `~25.5.2`)
- [x] Update `typescript` (`5.9.3` -> `~6.0.2`)
- [x] Update `babel-loader` (`8.4.1` -> `~10.1.1`)
- [x] **Verification**: Run `tsc --noEmit` locally and resolve any new type-checking errors. Ensure no Next.js build issues occur.

### 🟡 Phase 3: Formatting & Linting (ESLint v9/v10)
*High effort (configuration rewrite), but does not break runtime application logic.*
- [ ] **Branch**: `chore/update-linters`
- [ ] Fix `lint` script in `package.json` so that `bun lint` works properly (currently throws an "Invalid project directory" error).
- [ ] Update `prettier` (`2.8.8` -> `~3.8.1`)
- [ ] Update `eslint` (`8.10.0` -> `~10.1.0`)
- [ ] **BREAKING**: Migrate ESLint to v9+ Flat Config format (`eslint.config.js` or `eslint.config.mjs`), which might require updating all eslint plugins.
- [ ] **Verification**: Run `bun lint` and `bun run format`. Resolve formatting/linting issues.

### 🟡 Phase 4: Stripe Ecosystem (Critical)
*Critical risk. Requires extreme caution around the payments infrastructure.*
- [ ] **Branch**: `feature/update-stripe`
- [ ] Review Stripe's migration guides for major jumping versions.
- [ ] Update `@stripe/stripe-js` (`1.54.2` -> `~9.0.1`)
- [ ] Update `@stripe/react-stripe-js` (`1.16.5` -> `~6.1.0`)
- [ ] Refactor elements if Stripe requires the new Payment Element components over older iterations.
- [ ] **Verification**: Perform full end-to-end checkout flow using Stripe Test mode. Confirm webhooks and client-responses are handled correctly.

### 🟡 Phase 5: Tailwind CSS v4 Migration
*Highest effort. A paradigm shift in Tailwind from JS config to CSS variables.*
- [ ] **Branch**: `feature/update-tailwindcss-v4`
- [ ] Read the [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide).
- [ ] Utilize the official `@tailwindcss/upgrade` tool to automate migrations.
- [ ] Update `tailwindcss` (`3.4.19` -> `~4.2.2`)
- [ ] Update `tailwindcss-radix` (`2.9.0` -> `~4.0.2`)
- [ ] Ensure `tailwind.config.js` is fully deprecated correctly and moved into `global.css` (or equivalent).
- [ ] **Verification**: Visually verify UI layouts, animations, and ensure `radix` UI states (like `data-[state=open]`) still style correctly.

---

## 📝 AI Audit Log
*(AIs: When you finish a phase, document the changes here. Include date, PR/Branch name, and notes on what broke or was required to fix).*

- **2026-04-03**: `AI_UPDATE_PLAN.md` created. Strategy officially defined.
- **2026-04-03**: Completed Phase 1 on branch `chore/update-vercel-tools`. Updated `@vercel/analytics`, `@vercel/speed-insights`, and `next-devtools-mcp`. Tested with `bun run build`, everything succeeded smoothly.
- **2026-04-03**: Completed Phase 2 on branch `chore/update-build-tools` branched off `master` (which contains Phase 1). Updated `@types/node`, `typescript`, `babel-loader`. Fixed 55 type errors brought up by TS 6.0 enforcing stricter checks (e.g. `revalidateTag` required profile, missing `clx` import, undefined cart values). Verified with `tsc --noEmit` and `bun run build`.
