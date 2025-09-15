# Parity Test Mapping (Matrix → Tests)

For each matrix row, define concrete tests and oracles.

Auth
- Signup/Login/Logout: unit (validators), e2e forms (success/failure), session state assertions.
- Email Verification/Change Email: integration (send email event), contract (email content snapshot), e2e flow.
- Forgot/Reset/Set Password: unit (token validation), e2e forms.
- 2FA/Passkeys: unit (middleware), e2e device setup/use.
- Active Sessions: integration (list/revoke), e2e UI list.

Profile
- Avatar Upload: integration (upload URL generation), e2e (drag/drop, crop flow), side-effect check (object key present).
- Language/Name: unit (validation), e2e settings update.

Organizations
- Create/Change Name: unit (dto), e2e forms.
- Logo Upload: integration (org logo upload URL), e2e logo update.
- Invite/Accept: integration (invite record), contract (email snapshot), e2e invite accept.
- Members Manage: integration (role updates), e2e listing and role change.

Billing
- Pricing: e2e snapshot.
- Checkout/Portal: contract (URL shape), e2e redirect assertions; webhook side-effect checks (simulator where possible).
- Purchases List: integration (DB query), e2e list.

AI Chat
- CRUD/Messages: unit (validators), integration (DB ops), e2e conversation flow.

Marketing
- Newsletter/Contact: e2e submit; contract (payload).
- Content/Docs/Blog/Changelog: e2e navigation/snapshots.

Admin
- Users/Organizations list/find: integration (queries), e2e tables.

Cutover report
- CI job aggregates pass/fail per row; publish as artifact; block release on must-have failures.
