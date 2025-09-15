# Parity Matrix

Template for tracking must-have feature parity. Populate and maintain through migration.

Columns
- Feature: Human-readable name
- Area: Auth | Org | Billing | Content | Settings | AI | Admin | Marketing
- Parity Type: UI | Functional | API Contract | Data | Side-effects
- Current Ref: Path to current implementation or endpoint
- New Ref: Path to new implementation or action/API
- Tests: Unit | Integration | E2E | Contract | Snapshot | Visual
- Owner: DRI for migration
- Status: Planned | In Progress | Verified | Blocked

Matrix (initial pass; table view)

| Feature | Area | Parity Type | Current Ref | New Ref | Tests | Owner | Status |
|---|---|---|---|---|---|---|---|
| Auth: Signup | Auth | Functional+API | apps/web/modules/saas/auth/components/SignupForm.tsx (+ @repo/auth) | Server actions | unit+e2e | TBA | Planned |
| Auth: Login/Logout | Auth | Functional+API | apps/web/modules/saas/auth/components/LoginForm.tsx (+ @repo/auth) | Server actions | unit+e2e | TBA | Planned |
| Auth: Email Verification | Auth | Functional+Email | packages/mail/emails/EmailVerification.tsx | Actions (send) | integration+contract(mail) | TBA | Planned |
| Auth: Forgot/Reset Password | Auth | Functional | apps/web/modules/saas/auth/components/{ForgotPasswordForm,ResetPasswordForm}.tsx | Actions | unit+e2e | TBA | Planned |
| Auth: Set Password | Auth | Functional | apps/web/modules/saas/settings/components/SetPassword.tsx | Actions | unit+e2e | TBA | Planned |
| Auth: Change Email | Settings | Functional+Email | apps/web/modules/saas/settings/components/ChangeEmailForm.tsx | Actions | unit+e2e+contract(mail) | TBA | Planned |
| Auth: Change Password | Settings | Functional | apps/web/modules/saas/settings/components/ChangePassword.tsx | Actions | unit+e2e | TBA | Planned |
| Auth: Connected Accounts | Settings | Functional | apps/web/modules/saas/auth/constants/oauth-providers.tsx | Actions/unchanged | e2e | TBA | Planned |
| Auth: Active Sessions | Settings | Functional+Data | apps/web/modules/saas/settings/components/ActiveSessionsBlock.tsx | Actions | integration+e2e | TBA | Planned |
| Auth: Two-Factor (2FA) | Settings | Functional | apps/web/modules/saas/settings/components/TwoFactorBlock.tsx, OtpForm.tsx | Actions | unit+e2e | TBA | Planned |
| Auth: Passkeys | Settings | Functional | apps/web/modules/saas/settings/components/PasskeysBlock.tsx | Actions | unit+e2e | TBA | Planned |
| Profile: Avatar Upload | Settings | Functional+Side-effects | API: users.avatarUploadUrl; apps/web/modules/saas/settings/components/UserAvatarUpload.tsx | Actions | integration+e2e | TBA | Planned |
| Profile: Language/Name | Settings | Functional | apps/web/modules/saas/settings/components/{UserLanguageForm,ChangeNameForm}.tsx | Actions | unit+e2e | TBA | Planned |
| Orgs: Create Org | Org | Functional+Data | apps/web/modules/saas/organizations/components/CreateOrganizationForm.tsx | Use-cases + Actions | integration+e2e | TBA | Planned |
| Orgs: Change Name | Org | Functional | apps/web/modules/saas/organizations/components/ChangeOrganizationNameForm.tsx | Actions | unit+e2e | TBA | Planned |
| Orgs: Upload Logo | Org | Functional+Side-effects | API: organizations.createLogoUploadUrl; OrganizationLogoForm.tsx | Actions | integration+e2e | TBA | Planned |
| Orgs: Invite Member | Org | Functional+Email | InviteMemberForm.tsx; mail/OrganizationInvitation.tsx | Actions | integration+contract(mail)+e2e | TBA | Planned |
| Orgs: Accept Invitation | Org | Functional | OrganizationInvitationModal.tsx | Actions | e2e | TBA | Planned |
| Orgs: Members Manage | Org | Functional+Data | OrganizationMembersList.tsx; roles | Actions | integration+e2e | TBA | Planned |
| Billing: Pricing | Billing | UI+Functional | PricingTable.tsx | Unchanged | e2e | TBA | Planned |
| Billing: Change Plan (Checkout) | Billing | Functional+Side-effects | API: payments.createCheckoutLink; ChangePlan.tsx | Actions | contract+e2e | TBA | Planned |
| Billing: Customer Portal | Billing | Functional | API: payments.createCustomerPortalLink | Actions | contract+e2e | TBA | Planned |
| Billing: Purchases List | Billing | Functional+Data | API: payments.listPurchases | Actions | integration+e2e | TBA | Planned |
| AI Chat: CRUD + Messages | AI | Functional+Data | ai.* procedures; AiChat.tsx | Actions or API | unit+integration+e2e | TBA | Planned |
| Newsletter Subscribe | Marketing | Functional | API: newsletter.subscribe | Actions | e2e | TBA | Planned |
| Contact Form | Marketing | Functional | API: contact.submit | Actions | e2e | TBA | Planned |
| Admin: Users List | Admin | Functional+Data | API: admin.users.list; UserList.tsx | Actions | integration+e2e | TBA | Planned |
| Admin: Orgs List/Find | Admin | Functional+Data | API: admin.organizations.list/find; OrganizationList.tsx | Actions | integration+e2e | TBA | Planned |
| Content/Docs/Blog/Changelog | Marketing | UI+Functional | Content/Docs/Blog | Unchanged | e2e snapshots | TBA | Planned |
| Onboarding: Initial Setup | Onboarding | Functional | OnboardingForm.tsx; OnboardingStep1.tsx | Actions | e2e | TBA | Planned |

Additional UI Pages (App Router)

| Feature | Area | Parity Type | Current Ref | New Ref | Tests | Owner | Status |
|---|---|---|---|---|---|---|---|
| Auth: Verify Email Page | Auth | UI+Functional | apps/web/app/auth/verify/page.tsx | Unchanged/Actions | e2e | TBA | Planned |
| Auth: Signup Page | Auth | UI+Functional | apps/web/app/auth/signup/page.tsx | Actions | e2e | TBA | Planned |
| Auth: Login Page | Auth | UI+Functional | apps/web/app/auth/login/page.tsx | Actions | e2e | TBA | Planned |
| Auth: Forgot Password Page | Auth | UI+Functional | apps/web/app/auth/forgot-password/page.tsx | Actions | e2e | TBA | Planned |
| Auth: Reset Password Page | Auth | UI+Functional | apps/web/app/auth/reset-password/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Onboarding Page | Onboarding | UI+Functional | apps/web/app/(saas)/onboarding/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: New Organization Page | Org | UI+Functional | apps/web/app/(saas)/new-organization/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Organization Invitation Page | Org | UI+Functional | apps/web/app/(saas)/organization-invitation/[invitationId]/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Choose Plan Page | Billing | UI+Functional | apps/web/app/(saas)/choose-plan/page.tsx | Unchanged/Actions | e2e | TBA | Planned |
| SaaS: App Home | SaaS | UI+Functional | apps/web/app/(saas)/app/(account)/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Account Chatbot | SaaS | UI+Functional | apps/web/app/(saas)/app/(account)/chatbot/page.tsx | Actions/API | e2e | TBA | Planned |
| SaaS: Account Settings (General) | Settings | UI+Functional | apps/web/app/(saas)/app/(account)/settings/general/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Account Settings (Security) | Settings | UI+Functional | apps/web/app/(saas)/app/(account)/settings/security/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Account Settings (Billing) | Billing | UI+Functional | apps/web/app/(saas)/app/(account)/settings/billing/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Account Settings (Danger Zone) | Settings | UI+Functional | apps/web/app/(saas)/app/(account)/settings/danger-zone/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Admin Users | Admin | UI+Functional | apps/web/app/(saas)/app/(account)/admin/users/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Admin Organizations | Admin | UI+Functional | apps/web/app/(saas)/app/(account)/admin/organizations/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Admin Organization Detail | Admin | UI+Functional | apps/web/app/(saas)/app/(account)/admin/organizations/[id]/page.tsx | Actions | e2e | TBA | Planned |
| Org: Home | Org | UI+Functional | apps/web/app/(saas)/app/(organizations)/[organizationSlug]/page.tsx | Actions | e2e | TBA | Planned |
| Org: Chatbot | Org | UI+Functional | apps/web/app/(saas)/app/(organizations)/[organizationSlug]/chatbot/page.tsx | Actions/API | e2e | TBA | Planned |
| Org: Settings (General) | Org | UI+Functional | apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/general/page.tsx | Actions | e2e | TBA | Planned |
| Org: Settings (Members) | Org | UI+Functional | apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/members/page.tsx | Actions | e2e | TBA | Planned |
| Org: Settings (Billing) | Billing | UI+Functional | apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/billing/page.tsx | Actions | e2e | TBA | Planned |
| Org: Settings (Danger Zone) | Org | UI+Functional | apps/web/app/(saas)/app/(organizations)/[organizationSlug]/settings/danger-zone/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Catch-all Page | SaaS | UI+Functional | apps/web/app/(saas)/app/[...rest]/page.tsx | Actions | e2e | TBA | Planned |
| SaaS: Not Found | SaaS | UI | apps/web/app/(saas)/app/not-found.tsx | Unchanged | e2e | TBA | Planned |
| Marketing: Home (localized) | Marketing | UI+Functional | apps/web/app/(marketing)/[locale]/(home)/page.tsx | Unchanged | e2e snapshots | TBA | Planned |
| Marketing: Blog List | Marketing | UI+Functional | apps/web/app/(marketing)/[locale]/blog/page.tsx | Unchanged | e2e snapshots | TBA | Planned |
| Marketing: Blog Post | Marketing | UI+Functional | apps/web/app/(marketing)/[locale]/blog/[...path]/page.tsx | Unchanged | e2e snapshots | TBA | Planned |
| Marketing: Contact | Marketing | UI+Functional | apps/web/app/(marketing)/[locale]/contact/page.tsx | Actions | e2e | TBA | Planned |
| Marketing: Docs (layout/page) | Marketing | UI+Functional | apps/web/app/(marketing)/[locale]/docs/[[...path]]/{layout,page}.tsx | Unchanged | e2e snapshots | TBA | Planned |
| Marketing: Legal Pages | Marketing | UI+Functional | apps/web/app/(marketing)/[locale]/legal/[...path]/page.tsx | Unchanged | e2e snapshots | TBA | Planned |
| Marketing: Changelog | Marketing | UI+Functional | apps/web/app/(marketing)/[locale]/changelog/page.tsx | Unchanged | e2e snapshots | TBA | Planned |
| Marketing: Not Found | Marketing | UI | apps/web/app/(marketing)/[locale]/not-found.tsx | Unchanged | e2e | TBA | Planned |
| Global: Layout | Global | UI | apps/web/app/layout.tsx | Unchanged | e2e smoke | TBA | Planned |
| Global: Sitemap | Global | Functional | apps/web/app/sitemap.ts | Unchanged | unit | TBA | Planned |
| Global: Robots | Global | Functional | apps/web/app/robots.ts | Unchanged | unit | TBA | Planned |
| API: Image Proxy Route | Global | Functional+Security | apps/web/app/image-proxy/[...path]/route.ts | Unchanged | integration+security | TBA | Planned |
| API: Docs Search Route | Global | Functional | apps/web/app/api/docs-search/route.ts | Unchanged | integration | TBA | Planned |

API Surface (Hono/oRPC and handlers)

| Feature | Area | Parity Type | Current Ref | New Ref | Tests | Owner | Status |
|---|---|---|---|---|---|---|---|
| API: Auth Handler (/api/auth/**) | Auth | API Contract+Security | packages/api/index.ts (.on /auth/**) | Controllers/Unchanged | contract+security | TBA | Planned |
| API: OpenAPI Schema (/api/openapi) | API | API Contract | packages/api/index.ts (.get /openapi) | Controllers | contract | TBA | Planned |
| API: ORPC OpenAPI (/api/orpc-openapi) | API | API Contract | packages/api/index.ts (.get /orpc-openapi) | Controllers | contract | TBA | Planned |
| API: Scalar Docs (/api/docs) | API | UI+Functional | packages/api/index.ts (.get /docs Scalar) | Controllers | e2e | TBA | Planned |
| API: Payments Webhook (/api/webhooks/payments) | Billing | Functional+Side-effects+Security | packages/api/index.ts (.post /webhooks/payments) | Controllers/Adapters | integration+contract+security | TBA | Planned |
| API: Health Check (/api/health) | API | Functional | packages/api/index.ts (.get /health) | Controllers | unit | TBA | Planned |
| API: RPC/OpenAPI dynamic handlers (/api/*, /api/rpc/*) | API | API Contract | packages/api/index.ts (.use handlers) | Controllers | contract+integration | TBA | Planned |

Server Functions (Server Actions/Server-Only Utilities)

| Feature | Area | Parity Type | Current Ref | New Ref | Tests | Owner | Status |
|---|---|---|---|---|---|---|---|
| Server: Clear Cache (revalidatePath) | Global | Functional | apps/web/modules/shared/lib/cache.ts (clearCache) | Actions/Unchanged | unit+integration | TBA | Planned |
| Server: Update Locale | i18n | Functional | apps/web/modules/i18n/lib/update-locale.ts | Actions/Unchanged | unit+integration | TBA | Planned |
| Server: Get Session | Auth | Functional+Security | apps/web/modules/saas/auth/lib/server.ts (getSession) | Actions/Unchanged | unit+integration | TBA | Planned |
| Server: Get Active Organization | Org | Functional+Security | apps/web/modules/saas/auth/lib/server.ts (getActiveOrganization) | Actions/Unchanged | unit+integration | TBA | Planned |
| Server: List Organizations | Org | Functional+Security | apps/web/modules/saas/auth/lib/server.ts (getOrganizationList) | Actions/Unchanged | unit+integration | TBA | Planned |
| Server: List User Accounts | Auth | Functional+Security | apps/web/modules/saas/auth/lib/server.ts (getUserAccounts) | Actions/Unchanged | unit+integration | TBA | Planned |
| Server: List Passkeys | Auth | Functional+Security | apps/web/modules/saas/auth/lib/server.ts (getUserPasskeys) | Actions/Unchanged | unit+integration | TBA | Planned |
| Server: Get Invitation | Org | Functional | apps/web/modules/saas/auth/lib/server.ts (getInvitation) | Actions/Unchanged | unit+integration | TBA | Planned |

Reporting
- Track totals by Status; block release until all must-have items are Verified.

