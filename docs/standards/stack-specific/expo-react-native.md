# Expo React Native Patterns

> Engineering OS ships a React Native mobile app (Expo SDK 54, React Native 0.81.4) alongside the web Next.js app defined in `docs/standards/tech-stack.md`. Use this standard to structure the mobile codebase (`apps/mobile`), share domain logic via the monorepo packages, and deliver production builds through Expo Application Services (EAS) aligned with Azure services (Notification Hubs, Key Vault, Azure Monitor).

## Architectural Principles
- Keep the mobile app inside `apps/mobile/` following Feature-Sliced Design (`app/(auth)/`, `app/(dashboard)/`, etc.). Share core domain logic through `packages/core` and API contracts through `packages/contracts` so mobile and web consume the same types.
- Use Expo Router for file-based navigation. Each route segment is a React component; handle authentication in `app/(app)/_layout.tsx` with guards instead of scattering `useEffect` redirects.
- TanStack Query powers server-state on mobile; Zustand handles client state. Mirror the patterns from `docs/standards/stack-specific/tanstack-query.md` and `docs/standards/stack-specific/zustand-state.md` with mobile-friendly persistence (AsyncStorage, MMKV wrapped in Expo Secure Store for sensitive data).
- Communicate with backend services exclusively through `packages/contracts` (REST via Hono, oRPC). Never hardcode URLs; resolve the environment base URL from `app.config.ts` and remote config.
- Align authentication with Better-Auth. Run session refresh in a dedicated service, store tokens in Expo Secure Store, and propagate `Authorization` headers through a shared fetch client.

## Project Layout
```
apps/mobile/
├── app/
│   ├── _layout.tsx          # Root layout (providers, theming)
│   ├── (auth)/              # Auth stack
│   ├── (app)/               # Signed-in experience
│   ├── +api/health.ts       # API routes for local tooling
│   ├── +not-found.tsx
│   └── hooks/               # Route-level hooks
├── assets/                  # fonts, icons, images
├── app.config.ts            # Expo config (per-env)
├── eas.json                 # Build profile definitions
├── metro.config.js          # Monorepo-aware Metro settings
├── package.json
└── tsconfig.json
```
- Extend the root `tsconfig.base.json`; keep path aliases aligned with the web app.
- Use `babel.config.js` to alias packages and enable Reanimated if needed.

## Navigation and State
- Guard navigation with Expo Router layouts: `app/(auth)/_layout.tsx` handles unauthenticated screens, `app/(app)/_layout.tsx` enforces session presence and injects providers (TanStack Query, Zustand, Better-Auth client).
- Use `app/+html.tsx` for web-specific SEO if the Expo app targets web.
- Implement deep linking via `app/+native-intent.tsx` and `Linking.createURL`. Support universal links and Android intents for cross-app flows.
- Keep device state (sensors, network) in dedicated stores. Subscribe/unsubscribe in React components with `useFocusEffect` to avoid battery drain.

## Networking and Services
- Centralize API clients in `packages/api-clients` (shared). Use `fetch` polyfills (`react-native-url-polyfill`) and interceptors for telemetry headers (traceparent, user ID).
- Cache responses with TanStack Query hydration. Persist caches to AsyncStorage using `persistQueryClient` and synchronize on app resume.
- Use Expo Secure Store for auth tokens and secrets. For large encrypted payloads, escalate to native modules with Keychain/Keystore bridging.
- Integrate push notifications with Expo Notifications wired to Azure Notification Hubs. Route registration tokens through Better-Auth server actions and store per-device metadata.

## Styling and UI
- Tailwind-in-RN via `nativewind` or `tamagui` is acceptable, but maintain a shared design system in `packages/ui` with platform-aware components (e.g., `Button`, `Sheet`).
- Use `expo-font` for variable fonts that match the web brand. Load fonts in the root layout before rendering the app shell.
- Provide accessibility support: set `accessibilityRole`, `testID`, and dynamic type scaling. Validate with E2E tests using Maestro or Detox plus Expo's accessibility tooling.

## Build, Release, and Updates
- Configure `eas.json` with `development`, `preview`, and `production` profiles. Use EAS Build to generate managed binaries; store signing credentials in Expo's secret store or Azure Key Vault (synced via scripts).
- Use channel-based updates: `preview` channel for QA testers, `production` for GA. Pair OTA updates with Git tags and release notes in `docs/releases/mobile`.
- Automate builds via GitHub Actions calling `eas build --non-interactive`. Use runtime versions in `app.config.ts` to guarantee compatibility (`runtimeVersion.policy = 'sdkVersion'`).
- Capture build artifacts and symbol files (Sentry sourcemaps) in CI for crash diagnostics.

## Testing and Quality Gates
- Unit test hooks and utilities with Vitest (configured to run under `expo-module-test`).
- Component tests: React Native Testing Library with Jest preset from Expo. Mock native modules using `expo-jest-presets`.
- E2E flows: Maestro Cloud or Detox with Expo run commands. Keep deterministic seed data and run nightly smoke tests.
- Performance: monitor bundle size via `expo export --dump-sourcemap` and run `expo doctor` in CI.

## Observability and Ops
- Instrument network calls with OpenTelemetry React Native SDK sending traces to Azure Monitor (OTLP/HTTP). Use `expo-network` to enrich telemetry with connection type.
- Pipe runtime errors to Sentry or Azure Monitor. Use `ErrorBoundary` components around critical flows (checkout, onboarding).
- Configure feature flags via Azure App Configuration or LaunchDarkly; expose read-only config to the app and persist fallback defaults.

## Related Standards
- `docs/standards/stack-specific/nextjs-frontend.md`
- `docs/standards/stack-specific/tanstack-query.md`
- `docs/standards/stack-specific/zustand-state.md`
- `docs/standards/security/authentication.md`
- `docs/standards/development/testing-strategy.md`

<verification-block context-check="expo-mobile-verification">
  <verification_definitions>
    <test name="expo_app_directory_present">
      TEST: test -d apps/mobile/app
      REQUIRED: true
      ERROR: "Create apps/mobile/app with Expo Router routes to structure the mobile experience."
      DESCRIPTION: "Ensures the Expo app directory exists and uses file-based routing."
    </test>
    <test name="expo_config_present">
      TEST: test -f apps/mobile/app.config.ts || test -f apps/mobile/app.json
      REQUIRED: true
      ERROR: "Add app.config.ts (or app.json) to define Expo runtime configuration per environment."
      DESCRIPTION: "Verifies Expo configuration is source-controlled."
    </test>
    <test name="eas_profiles_defined">
      TEST: test -f apps/mobile/eas.json
      REQUIRED: true
      ERROR: "Define eas.json build profiles (development, preview, production) for managed releases."
      DESCRIPTION: "Checks that EAS Build profiles are present."
    </test>
    <test name="metro_config_present">
      TEST: test -f apps/mobile/metro.config.js || test -f apps/mobile/metro.config.cjs
      REQUIRED: false
      ERROR: "Include a Metro config that resolves workspace packages for Expo in the monorepo."
      DESCRIPTION: "Encourages Expo-aware Metro bundler configuration."
    </test>
    <test name="expo_router_layout_present">
      TEST: find apps/mobile/app -name '_layout.tsx' -o -name '_layout.ts' | head -1
      REQUIRED: false
      ERROR: "Add Expo Router layout files (_layout.tsx) to manage providers and guarded navigation."
      DESCRIPTION: "Encourages proper layout structure for Expo Router."
    </test>
  </verification_definitions>
</verification-block>

