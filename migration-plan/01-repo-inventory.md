# Repository Inventory (Current State)

High-level monorepo summary and detected stack. Source: workspace scan and package manifests (no changes applied).

Monorepo Structure
- Root tooling: `turbo` (v2.5.x), `pnpm`, `biome`, TS 5.9
- Apps
  - `apps/web` – Next.js 15.5.2 app (App Router), Playwright e2e
- Packages
  - `packages/api` – Hono-based API exposing oRPC and OpenAPI
  - `packages/database` – Drizzle ORM (postgres-js), drizzle-kit migrations, schemas
  - `packages/auth` – Auth package (better-auth), client/server usage in web
  - `packages/*` – ai, i18n, logs, mail, payments, storage, utils, etc.
- Config module: `config/` (shared types/config)
- Docs & Standards
  - `docs/standards` – EOS Standards DSL (root dispatcher at `standards.md`)
  - `docs/EngineeringOS/dsl` – EOS DSL technical docs (spec, guide, verification)
  - `docs/eos/README.md` – local EOS quickstart
- EOS Commands (Instructions DSL)
  - `.claude/commands` – analyze-product, create-spec, create-tasks, execute-tasks, core/plan-product
- CI
  - `.github/workflows` – validate-standards, governance-lint, PR lint + Playwright

Detected Stack (key versions)
- Next.js: 15.5.2
- React/DOM: 19.1.x
- Hono: 4.9.x
- Drizzle ORM: 0.44.5, drizzle-kit 0.31.x, postgres-js driver
- TanStack Query: 5.85.x
- Zustand: present (used in stack standards; usage patterns TBD)
- oRPC: used for RPC + OpenAPI generation
- Auth: better-auth
- Lint/Format: Biome 2.2.2

Key Scripts
- Root: `build`, `dev`, `start`, `lint`, `format`, `validate:standards`, `verify:local`, `lint:governance`
- apps/web: `build`, `dev`, `start`, `e2e`, `e2e:ci`, `type-check`
- packages/database: `generate`, `migrate`

Notable Integrations
- API: Next route `apps/web/app/api/[[...rest]]/route.ts` proxies to `@repo/api` (Hono)
- OpenAPI: generated from ORPC router + auth; Scalar UI served at `/api/docs`
- Database: Drizzle schemas + queries; Postgres via docker-compose provided

Governance and Standards Utilities
- Standards validation: `node scripts/validate-standards.mjs` (PASS)
- Verification shim: `node scripts/verification-shim.mjs` (used below; results in appendix)

Gaps Observed (early)
- No `.husky/` directory detected (pre-commit hooks)
- No adoption of next-safe-action for server actions
- Unit/integration test coverage structure not standardized; Playwright exists
- Mixed package-level Biome configs; need consistent gating and CI enforcement
- Architecture layering (domain/use-cases/controllers/infrastructure) not explicitly enforced in packages

Data Sources
- package.json files, `rg` scans, EOS quickstart docs, standards validator output

