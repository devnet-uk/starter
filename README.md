# supastarter for Next.js

supastarter is the ultimate starter kit for production-ready, scalable SaaS applications.

## Helpful links

- [📘 Documentation](https://supastarter.dev/docs/nextjs)
- [🚀 Demo](https://demo.supastarter.dev)

## Local Setup (Quick)

- Start Postgres (Docker): `docker compose up -d`
- Env: copy `.env.local.example` → `.env.local` and set `DATABASE_URL=postgresql://devnet_dev_user:devnet_pwd@localhost:5432/devnet_dev_db`
- Migrate schema: `pnpm --filter @repo/database generate && pnpm --filter @repo/database migrate`
- Run app: `pnpm --filter @repo/web dev` (http://localhost:3000)

## Content Collections Toggle

- This repo uses `@content-collections/*` to build docs/blog content.
- On some environments, live building can fail; you can disable it via:
  - `apps/web/.env.local`: set `DISABLE_CONTENT_COLLECTIONS=1`
  - Remove or set to `0` to re-enable live generation.

## Database ORM

- Prisma has been removed; the project uses Drizzle ORM.
- Commands:
  - Generate migration: `pnpm --filter @repo/database generate`
  - Apply migration: `pnpm --filter @repo/database migrate`
