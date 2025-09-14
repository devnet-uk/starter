# GEMINI.md

## Project Overview

This is a Next.js SaaS starter kit called "supastarter". It's a pnpm monorepo with a Next.js frontend, a Hono backend, and a PostgreSQL database. It uses Drizzle ORM for database access, Biome for code formatting and linting, and Playwright for end-to-end testing.

The project is structured as a monorepo with the following key directories:

*   `apps/web`: The main Next.js application.
*   `packages/api`: The Hono API.
*   `packages/auth`: Authentication logic.
*   `packages/database`: Database schema and migrations using Drizzle ORM.
*   `packages/i18n`: Internationalization.
*   `packages/mail`: Email sending.
*   `packages/payments`: Payment processing.
*   `packages/storage`: File storage.
*   `tooling/tailwind`: Tailwind CSS configuration.
*   `tooling/typescript`: TypeScript configuration.

## Building and Running

### Prerequisites

*   Node.js (>=20)
*   pnpm (>=10.14.0)
*   Docker

### Local Development

1.  **Start Postgres:**
    ```bash
    docker compose up -d
    ```
2.  **Set up environment variables:**
    Copy `.env.local.example` to `.env.local` and set the `DATABASE_URL`:
    ```
    DATABASE_URL=postgresql://devnet_dev_user:devnet_pwd@localhost:5432/devnet_dev_db
    ```
3.  **Run database migrations:**
    ```bash
    pnpm --filter @repo/database generate && pnpm --filter @repo/database migrate
    ```
4.  **Run the application:**
    ```bash
    pnpm --filter @repo/web dev
    ```
    The application will be available at http://localhost:3000.

### Other Commands

*   **Build:** `pnpm build`
*   **Start:** `pnpm start`
*   **Lint:** `pnpm lint`
*   **Check:** `pnpm check`
*   **Format:** `pnpm format`
*   **Clean:** `pnpm clean`

## Development Conventions

*   **Code Style:** The project uses Biome for code formatting and linting. Run `pnpm format` to format the code and `pnpm lint` to check for linting errors.
*   **Database:** The project uses Drizzle ORM. To generate a new migration, run `pnpm --filter @repo/database generate`. To apply migrations, run `pnpm --filter @repo/database migrate`.
*   **Testing:** The project uses Playwright for end-to-end testing. Run `pnpm e2e` to run the tests.
*   **API:** The API is built with Hono and uses oRPC. The API documentation is available at `/docs/api` when the application is running.
