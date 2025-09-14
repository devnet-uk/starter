# Local Development Environment

## Overview

This document outlines the standardized local development environment setup. Using a consistent, containerized environment is crucial for eliminating "it works on my machine" issues, streamlining onboarding, and ensuring that development, testing, and production environments are as similar as possible.

The primary recommendation is to use the **VS Code Devcontainer**. A `docker-compose.yml` setup is also provided for those who do not use VS Code or prefer a manual approach.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/)
- [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) VS Code extension

## 1. Devcontainer (Recommended)

This project is configured to run in a devcontainer. To get started:

1.  Open the project root in VS Code.
2.  A notification will appear asking to "Reopen in Container". Click it.
3.  VS Code will build the Docker image, start the services (app, database, etc.), and connect your editor, fully configured with all necessary tools.

### Devcontainer Configuration

The devcontainer is defined by three key files in the `.devcontainer` directory:

**`.devcontainer/devcontainer.json`**: Configures the VS Code environment inside the container, including settings, extensions, and forwarded ports.
```json
{
  "name": "Engineering OS Devcontainer",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode-remote.remote-containers",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "vscode-icons-team.vscode-icons"
      ],
      "settings": {
        "terminal.integrated.shell.linux": "/bin/bash"
      }
    }
  },
  "forwardPorts": [3000, 5432, 9090, 16686],
  "postCreateCommand": "pnpm install"
}
```

**`.devcontainer/Dockerfile`**: Defines the base image for the application service.
```dockerfile
FROM mcr.microsoft.com/devcontainers/typescript-node:18-bullseye

# Install pnpm
RUN su node -c "npm install -g pnpm"

# Set user to node
USER node
```

**`.devcontainer/docker-compose.yml`**: Orchestrates all the services required for local development. See the "Local Observability Stack" section for the full file content including monitoring services.

## 2. Environment Variable Management

We use **`dotenv-vault`** to securely manage and sync environment variables across the team.

1.  **Create a `.env.local` file**: This file is for your personal, local-only overrides and is git-ignored.
2.  **Create a `.env.me` key**: Run `npx dotenv-vault new me` to generate your unique decryption key. This file is git-ignored and must never be committed.
3.  **Pull remote secrets**: Run `npx dotenv-vault pull` to populate your local `.env` file with the latest variables from the vault for your environment (e.g., development).
4.  **Push local changes**: When you add or change a variable for the team, run `npx dotenv-vault push` to securely update the central vault.

**Security Note**: The `.env.me` key is your personal secret. Keep it safe and do not share it.

## 3. Local SSL Certificates

For features requiring a secure context (HTTPS), use the Next.js built-in `mkcert` integration.

1.  **Update `package.json` scripts**:
    ```json
    "scripts": {
      "dev": "next dev",
      "dev:https": "next dev --experimental-https"
    }
    ```
2.  **Run the HTTPS server**:
    ```bash
    pnpm dev:https
    ```
The first time you run this, `mkcert` will automatically create a local Certificate Authority (CA) and you may be prompted for your password to install it in your system's trust store. Your application will then be available at `https://localhost:3000`.

## 4. Local Observability Stack

To debug and monitor the application locally, our devcontainer includes a full observability stack.

-   **PostgreSQL Database**: The primary application database.
-   **Jaeger**: For viewing distributed traces.
-   **Prometheus**: For collecting and querying metrics.
-   **OTel Collector**: To receive telemetry from the app and export it to Jaeger and Prometheus.

These services are defined in the `docker-compose.yml` file.

**File: `.devcontainer/docker-compose.yml`**
```yaml
version: '3.8'
services:
  app:
    build: .
    command: sleep infinity
    volumes:
      - ..:/workspace:cached
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - otel-collector
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/db
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318

  postgres:
    image: postgres:16
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # Jaeger UI
      - "4318:4318"   # OTLP HTTP receiver

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yml"]
    volumes:
      - ./otel-collector-config.yml:/etc/otel-collector-config.yml
    ports:
      - "8889:8889"   # Prometheus exporter
    depends_on:
      - jaeger
      - prometheus

volumes:
  postgres-data:
```

## 5. Database Seeding
To populate your local database with test data, run the seed script:
```bash
pnpm db:seed
```
This script uses the connection details from your `.env` file to connect to the local PostgreSQL container.

## Verification Tests

<!-- Verification block for devcontainer setup (greenfield = required) -->
<verification-block context-check="verification-devcontainer-setup">
  <verification_definitions>
    <test name="devcontainer_directory_exists">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || test -d .devcontainer
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: ".devcontainer directory not found. Greenfield projects must include a devcontainer for consistent local environments."
      FIX_COMMAND: "Create a .devcontainer directory using templates from this standard."
      DESCRIPTION: "Requires a VS Code devcontainer setup for greenfield projects; advisory otherwise"
    </test>
    <test name="devcontainer_core_files_exist">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || ((test -f .devcontainer/devcontainer.json || test -f .devcontainer/devcontainer.yaml) && test -f .devcontainer/docker-compose.yml)
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: "Devcontainer core files missing. Expect devcontainer.json(yaml) and docker-compose.yml for greenfield projects."
      FIX_COMMAND: "Add devcontainer.json and docker-compose.yml from the examples in local-environment.md"
      DESCRIPTION: "Requires core devcontainer files for greenfield projects"
      DEPENDS_ON: ["devcontainer_directory_exists"]
    </test>
    <test name="devcontainer_ports_configured">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || (grep -Eq '"forwardPorts"\s*:\s*\[' .devcontainer/devcontainer.json 2>/dev/null || grep -q 'ports:' .devcontainer/docker-compose.yml 2>/dev/null)
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: "Devcontainer port forwarding not detected. Configure ports for app and services (required for greenfield)."
      FIX_COMMAND: "Add forwardPorts in devcontainer.json and map ports in docker-compose.yml"
      DESCRIPTION: "Requires devcontainer to expose common service ports for greenfield projects"
      DEPENDS_ON: ["devcontainer_core_files_exist"]
    </test>
  </verification_definitions>
</verification-block>
