# Next.js Frontend Patterns

> Engineering OS ships Next.js 15.5.3 (App Router) on Node.js 22 LTS as defined in `docs/standards/tech-stack.md`. Keep this standard as the canonical reference for building feature-sliced web frontends that compose with TanStack Query, Zustand, Drizzle, next-safe-action, Better-Auth, and the Azure-first hosting stack.

## Golden Rules
- Default every `app/` module to a React Server Component (RSC). Add `'use client'` sparingly and never re-export server-only utilities to the client boundary.
- Co-locate route logic, loaders, and UI per feature slice. Keep domain/business orchestration in `packages/core` and data access through Drizzle repositories; do not query databases directly from React components.
- Mutations go through next-safe-action server actions or oRPC procedures so validation, auth, and auditing stay centralized. Never call fetchable REST endpoints directly from client components for privileged work.
- Make caching explicit: set `segment.config.ts` and `revalidatePath`/`revalidateTag` on any route that reads mutable data. Opt into Partial Prerendering (PPR) for routes that mix static shells with dynamic islands.
- Stream progressively. Wrap slow resources in `Suspense`, provide `loading.tsx` skeletons, and return meaningful fallbacks before entering the client tier.
- Follow complementary standards: TanStack Query for server-state hydration, Zustand for client state, Vercel deployment for preview hosting, and Integration Strategy for contract-first APIs.

## App Structure and Routing
- Feature-sliced layout: `app/(marketing)/`, `app/(dashboard)/`, and nested route groups map to product surfaces. Keep shared providers in `app/layout.tsx` or slice-specific `layout.tsx` files.
- Use `template.tsx` for per-navigation state (e.g., preserving streaming shells) and reserve `layout.tsx` for deterministic wrappers.
- Always include `loading.tsx`, `error.tsx`, and (for optional segments) `default.tsx` so streaming and recoverability are first-class.
- Prefer route handlers under `app/api/*/route.ts` only for edge-compatible, stateless endpoints. Business logic should still flow through `packages/api` (Hono/oRPC) so HTTP handlers can be deployed independently when needed.

### Segment Configuration
Declare runtime, revalidation, and preferred cache mode per route with `segment.config.ts`:

```ts
// app/(dashboard)/invoices/segment.config.ts
import type { SegmentConfig } from 'next'

export const runtime: SegmentConfig['runtime'] = 'nodejs'
export const preferredRegion = ['centralus']
export const revalidate = 60 // seconds; align with business freshness
export const dynamicParams = false // fail on unknown invoice IDs
```

- Default SSR routes to the Node.js runtime to match Azure Container Apps. Only opt into the Edge runtime for stateless, latency-sensitive UI and ensure dependencies (e.g., Drizzle Postgres client) are edge-safe.
- When a route must be fully dynamic (`revalidate = 0`), document the reason in code comments and pair it with targeted revalidation (tags or paths) to avoid global cache busts.

### Partial Prerendering (PPR)
- Enable `experimental.ppr = true` in `next.config.mjs` and mark interactive sections with `fallback.js`. Pre-render the static frame and stream dynamic slots once data resolves.
- Use PPR for dashboards or marketing pages that show always-on hero content plus personalized widgets. Keep widgets in client components fed by TanStack Query hydration to avoid blocking the shell.

## Server Components and Client Boundaries
- Treat RSCs as the default delivery surface: fetch data, read environment secrets, and compose Markdown/MDX on the server. Pass only serializable props to client components.
- Wrap third-party client-only widgets behind thin adapters in `app/_client/` so imports stay hygienic (one `'use client'` per file).
- Validate boundary placement in code review: any file that calls `useState`, `useEffect`, `window`, or browser APIs must be a client component.
- Use `React.cache()` (or Next’s `cache()` helper) around expensive data fetchers to dedupe within a request lifecycle. Pair with `revalidateTag` for targeted invalidation.

## Data Fetching, Caching, and Revalidation
- Prefer direct data loading in RSCs via `await` on Drizzle-driven domain queries. Keep fetchers pure (no side effects) and leverage `AbortSignal` from `fetch` to cancel on navigation.
- For multi-source reads, compose `Promise.all` in the server component and stream each section behind `Suspense`. Provide stable keys for `Suspense` boundaries so transitions reuse fallbacks.
- Use Next’s Request Memoization: the same `fetch` URL with identical options in a render tree is cached automatically. For library functions, wrap fetchers in `cache(fetcher)` to preserve memoization across modules.
- When mutating data, call `revalidateTag('invoices')` or `revalidatePath('/dashboard/invoices')` from the server action to keep caches coherent. Avoid `router.refresh()` from the client except as a last resort.
- Draft mode toggles (`draftMode().enable()`) should live in dedicated server actions that scope preview cookies to marketing routes.

## Mutations and Server Actions
- Implement mutations with `next-safe-action`. Define action schemas in `packages/contracts`, enforce auth/scopes via Better-Auth, and call Drizzle repositories inside the server action body.
- Co-locate optimistic UI logic in client components using TanStack Query mutations. Server actions return structured results (`{ status: 'success', data }`) so clients can invalidate and hydrate deterministically.
- Treat server actions as orchestration layers: they should call domain use-cases in `packages/core`, emit events to BullMQ when necessary, and encapsulate audit logging.

## Client State and Hydration
- Hydrate TanStack Query by prefetching in RSCs (`await queryClient.ensureQueryData`) and wrapping client trees with `HydrationBoundary`. Follow `docs/standards/stack-specific/tanstack-query.md` for query factories and retry policy.
- Use Zustand for ephemeral UI or cross-component state. Instantiate stores in `packages/ui/state` and hydrate within client providers under `app/providers.tsx`. Guard against double hydration with `_hasHydrated` flags per `docs/standards/stack-specific/zustand-state.md`.
- Keep React Context providers as deep as possible. Compose them in feature-level layouts to avoid rendering client providers globally unless absolutely required (e.g., Better-Auth session provider).

## Styling and UI Composition
- Tailwind CSS 4.x is the default styling layer. Configure via `@tailwindcss/vite` when running the dev server (`pnpm dev`).
- Generate design tokens in `packages/ui/design-tokens` and import via CSS variables. Use `next/font` with variable fonts to avoid FOIT/FOUC.
- Co-locate component variants with CVA. Export headless primitives from `packages/ui/components`, and compose them into feature-specific client components within route segments.
- For accessibility, ship semantic HTML first, then enrich with client-side behaviour. Validate with Playwright axe scans in CI.

## Runtime Configuration and Deployment
- Maintain a single `next.config.mjs` with `output: 'standalone'`, `experimental.turbo: true`, and the `transpilePackages` list that matches internal packages.
- Keep environment separation via `.env.development.local`, `.env.preview`, and Azure-provisioned production secrets. Never read secrets in client components; use server actions or RSC loaders.
- Instrument `instrumentation.ts` to register OpenTelemetry, request logging, and Azure Monitor exporters. Export a wrapped `fetch` that adds trace propagation headers for downstream services.
- Align preview hosting with `docs/standards/stack-specific/vercel-deployment.md`; production runs inside Azure Container Apps with `pnpm build && pnpm start` using the standalone output.

## Observability, Errors, and Testing
- Surface recoverable failures through `error.tsx` boundaries scoped per route group. Log enriched error metadata (request ID, user ID, feature flag state) before rethrowing.
- Register global interceptors in `middleware.ts` for security headers, Better-Auth session verification, and feature flag evaluation. Keep middleware fast—no blocking I/O outside key-value lookups.
- Unit test RSC helpers and server actions with Vitest using the Node 22 environment. Use Playwright for route-level smoke tests, especially around streaming transitions and auth flows.
- When integrating Vercel AI SDK or other AI features, stream tokens from RSCs and surface them through client readers built on `useStream`. Ensure fallbacks render instantly and degrade gracefully when AI providers fail.

<verification-block context-check="nextjs-frontend-verification">
  <verification_definitions>
    <test name="next_config_present">
      TEST: test -f next.config.mjs || test -f apps/web/next.config.mjs
      REQUIRED: true
      ERROR: "Next.js configuration file missing. Add next.config.mjs at the workspace root or under apps/web."
      DESCRIPTION: "Ensures the Next.js project defines a configuration file for build/runtime settings."
    </test>
    <test name="standalone_output_enabled">
      TEST: node -e "const fs=require('fs');const paths=['next.config.mjs','apps/web/next.config.mjs'];const file=paths.find((p)=>fs.existsSync(p));if(!file)process.exit(1);const text=fs.readFileSync(file,'utf8');process.exit(/output:\s*['\"]standalone['\"]/m.test(text)?0:1);"
      REQUIRED: true
      ERROR: "Configure Next.js with output: 'standalone' to align with Azure Container Apps deployment."
      DESCRIPTION: "Verifies the build output targets standalone mode for containerized hosting."
    </test>
    <test name="turbo_enabled">
      TEST: node -e "const fs=require('fs');const paths=['next.config.mjs','apps/web/next.config.mjs'];const file=paths.find((p)=>fs.existsSync(p));if(!file)process.exit(1);const text=fs.readFileSync(file,'utf8');process.exit(/experimental\s*:\s*{[^}]*turbo\s*:\s*true/m.test(text)?0:1);"
      REQUIRED: true
      ERROR: "Enable experimental.turbo = true in next.config.mjs to leverage Rust-based compilation."
      DESCRIPTION: "Checks that Turbo build acceleration remains enabled per Engineering OS defaults."
    </test>
    <test name="ppr_enabled">
      TEST: node -e "const fs=require('fs');const paths=['next.config.mjs','apps/web/next.config.mjs'];const file=paths.find((p)=>fs.existsSync(p));if(!file)process.exit(1);const text=fs.readFileSync(file,'utf8');process.exit(/experimental\s*:\s*{[^}]*ppr\s*:\s*true/m.test(text)?0:1);"
      REQUIRED: false
      ERROR: "Consider enabling experimental.ppr = true to unlock partial prerendering for mixed static/dynamic pages."
      DESCRIPTION: "Encourages adopting Partial Prerendering for better TTFB and streaming UX."
    </test>
    <test name="app_directory_present">
      TEST: test -d apps/web/app
      REQUIRED: true
      ERROR: "Next.js App Router directory missing. Create apps/web/app with route segments."
      DESCRIPTION: "Ensures the project uses App Router with the expected directory layout."
    </test>
    <test name="loading_boundaries_present">
      TEST: find apps/web/app -name loading.tsx -o -name loading.ts | head -1
      REQUIRED: true
      ERROR: "Add loading.tsx files so each segment streams with skeleton fallbacks."
      DESCRIPTION: "Verifies loading boundaries exist to support Suspense streaming."
    </test>
    <test name="error_boundaries_present">
      TEST: find apps/web/app -name error.tsx -o -name error.ts | head -1
      REQUIRED: true
      ERROR: "Provide error.tsx boundaries to surface recoverable failures per route."
      DESCRIPTION: "Checks for error boundaries to match the resiliency guidance."
    </test>
    <test name="middleware_present">
      TEST: test -f middleware.ts || test -f apps/web/middleware.ts
      REQUIRED: false
      ERROR: "Consider adding middleware.ts to enforce global headers, auth, and feature flags."
      DESCRIPTION: "Encourages registering Next.js middleware for cross-cutting concerns."
    </test>
    <test name="instrumentation_present">
      TEST: test -f instrumentation.ts || test -f apps/web/instrumentation.ts
      REQUIRED: false
      ERROR: "Add instrumentation.ts to wire OpenTelemetry and request logging for observability."
      DESCRIPTION: "Confirms instrumentation hooks are present for tracing."
    </test>
    <test name="providers_module_present">
      TEST: test -f apps/web/app/providers.tsx || test -f apps/web/app/providers.ts
      REQUIRED: false
      ERROR: "Expose a providers.tsx module to compose client providers (auth, query client, theming)."
      DESCRIPTION: "Encourages co-locating client providers within the App Router."
    </test>
  </verification_definitions>
</verification-block>

## Related Standards
- `docs/standards/architecture/integration-strategy.md` — contract-first orchestration, shared DTOs, and eventing.
- `docs/standards/stack-specific/tanstack-query.md` — server-state hydration and mutation patterns.
- `docs/standards/stack-specific/next-safe-action.md` — secure server actions and validation.
- `docs/standards/stack-specific/zustand-state.md` — client store setup and hydration in RSC environments.
- `docs/standards/stack-specific/vercel-deployment.md` — preview deployment specifics.
