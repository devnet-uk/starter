# Monorepo Initialization Guide

## Overview

This guide outlines the standard procedure for initializing a new monorepo using pnpm workspaces and Turborepo. The structure aligns with the principles defined in our [Technical Stack](./../tech-stack.md) and is designed for optimal performance, type safety, and developer experience.

## 1. PNPM Workspace Setup

pnpm workspaces are used to manage dependencies and link local packages within the monorepo.

### Step 1: Initialize Project
Start with a new directory and initialize a `package.json` file.

```bash
mkdir my-new-monorepo
cd my-new-monorepo
pnpm init
```

### Step 2: Create Workspace Configuration
Create a `pnpm-workspace.yaml` file in the root directory to define the locations of your apps and packages.

**File: `pnpm-workspace.yaml`**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

This configuration tells pnpm to find all projects located within the `apps/` and `packages/` directories.

## 2. Turborepo Configuration

Turborepo is used to manage tasks, caching, and build pipelines across the monorepo.

### Step 1: Install Turborepo
Add Turborepo as a root-level dev dependency.

```bash
pnpm add turbo --save-dev -w
```

### Step 2: Configure Turbo
Create a `turbo.json` file in the root directory. This configuration defines the task pipeline, ensuring tasks run in the correct order and are properly cached.

**File: `turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*", "tsconfig.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "format:check": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

## 3. Package Scaffolding

Create the initial directory structure and placeholder `package.json` files for applications and shared packages.

> Version alignment: pull canonical package versions (Next.js, React, TypeScript, Expo, pnpm) from `docs/standards/tech-stack.md` before scaffolding. Update these snippets if the tech stack file changes.

### Step 1: Create Directories
```bash
mkdir -p apps/web packages/ui packages/core packages/contracts
```

### Step 2: Create Placeholder Packages
Create a `package.json` in each new directory.

**Example for an application (`apps/web/package.json`):**
```json
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.5.3",
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "@workspace/ui": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "22.x",
    "@types/react": "19.x",
    "typescript": "5.9.2"
  }
}
```

**Example for a shared package (`packages/ui/package.json`):**
```json
{
  "name": "@workspace/ui",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "lint": "biome check src"
  },
  "dependencies": {
    "react": "19.1.1"
  },
  "devDependencies": {
    "tsup": "latest",
    "typescript": "5.9.2"
  }
}
```
*Note the use of `"@workspace/ui": "workspace:*"` to link local packages.*

## 4. Next.js Application Setup

To ensure Next.js correctly compiles the shared packages from the `packages/` directory, you must configure it to transpile them.

Create a `next.config.mjs` file in your Next.js app (e.g., `apps/web`).

**File: `apps/web/next.config.mjs`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui', '@workspace/core'],
};

export default nextConfig;
```

<conditional-block task-condition="expo|mobile|react-native|ios|android" context-check="monorepo-expo-setup">
IF the task involves setting up a mobile application:

## 5. React Native & Expo Setup

To add a mobile application to the monorepo, follow these steps.

### Step 1: Create the Expo App
Create the app inside the `apps` directory.

```bash
cd apps
pnpm create expo-app mobile
```

### Step 2: Configure Metro for Monorepo
The Metro bundler needs to know how to find packages in the workspace root. Create a `metro.config.js` in your mobile app's directory (`apps/mobile`).

**File: `apps/mobile/metro.config.js`**
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// 3. Force Metro to resolve dependencies from the root
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

### Step 3: Update Mobile App's `package.json`
Add a reference to any shared packages (e.g., `@workspace/ui`).

**File: `apps/mobile/package.json`**
```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "expo": "~51.0.21",
    "react": "18.2.0",
    "react-native": "0.74.3",
    "@workspace/ui": "workspace:*"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "typescript": "5.9.2"
  },
  "private": true
}
```
</conditional-block>

## 6. TypeScript Configuration

A root `tsconfig.json` manages the overall TypeScript configuration, ensuring consistency and enabling path aliases.

> **Note:** The settings in `tsconfig.base.json` are derived from the project's official style guide. For a detailed explanation of each compiler option, please refer to the [TypeScript Style Guide](../code-style/typescript-style.md).

### Step 1: Create Base TSConfig
Create a `tsconfig.base.json` in the root. This file will be extended by all other `tsconfig.json` files in the monorepo.

**File: `tsconfig.base.json`**
```json
{
  "compilerOptions": {
    // Core strict settings from the project's style guide
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    
    // Enhanced strictness
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    
    // Additional safety checks
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    // Module resolution for modern tooling
    "moduleResolution": "bundler",
    "module": "ESNext",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    // Performance
    "skipLibCheck": true,
    
    // Modern JavaScript features
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],

    // Path mapping for monorepo
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["packages/ui/src/components/*"],
      "@/lib/*": ["packages/core/src/lib/*"],
      "@/contracts/*": ["packages/contracts/src/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Create Root TSConfig
Create a `tsconfig.json` in the root to orchestrate TypeScript for the entire monorepo, primarily for editor support and path resolution.

**File: `tsconfig.json`**
```json
{
  "extends": "./tsconfig.base.json"
}
```

### Step 3: Configure Package-Level TSConfig
Each app and package should have its own `tsconfig.json` that extends the base configuration.

**Example for `apps/web/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Verification Tests

<!-- Verification block for monorepo essentials configuration -->
<verification-block context-check="verification-monorepo-essentials">
  <verification_definitions>
    <test name="pnpm_workspace_config_exists">
      TEST: test -f pnpm-workspace.yaml
      REQUIRED: true
      BLOCKING: true
      ERROR: "pnpm-workspace.yaml is missing. Create a workspace config with apps and packages globs."
      FIX_COMMAND: "Create pnpm-workspace.yaml using the template in monorepo-setup.md (packages: ['apps/*', 'packages/*'])."
      DESCRIPTION: "Verifies that a pnpm workspaces configuration exists at the repository root"
    </test>
    <test name="workspace_glob_apps_has_dir">
      TEST: (grep -Eq "apps/\\*" pnpm-workspace.yaml 2>/dev/null && test -d apps) || ! grep -Eq "apps/\\*" pnpm-workspace.yaml 2>/dev/null
      REQUIRED: false
      BLOCKING: false
      ERROR: "Workspace glob 'apps/*' is declared in pnpm-workspace.yaml but 'apps/' directory is missing."
      FIX_COMMAND: "mkdir -p apps"
      DEPENDS_ON: ["pnpm_workspace_config_exists"]
      DESCRIPTION: "Advisory: If 'apps/*' is declared as a workspace, ensure the 'apps/' directory exists."
    </test>
    <test name="workspace_glob_packages_has_dir">
      TEST: (grep -Eq "packages/\\*" pnpm-workspace.yaml 2>/dev/null && test -d packages) || ! grep -Eq "packages/\\*" pnpm-workspace.yaml 2>/dev/null
      REQUIRED: false
      BLOCKING: false
      ERROR: "Workspace glob 'packages/*' is declared in pnpm-workspace.yaml but 'packages/' directory is missing."
      FIX_COMMAND: "mkdir -p packages"
      DEPENDS_ON: ["pnpm_workspace_config_exists"]
      DESCRIPTION: "Advisory: If 'packages/*' is declared as a workspace, ensure the 'packages/' directory exists."
    </test>
    <test name="turbo_config_exists">
      TEST: test -f turbo.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Turborepo configuration (turbo.json) is missing."
      FIX_COMMAND: "Copy the turbo.json template from this standard into the repository root."
      DESCRIPTION: "Ensures Turborepo task pipeline is configured for the monorepo"
    </test>
    <test name="workspace_directories_present">
      TEST: test -d apps && test -d packages
      REQUIRED: false
      BLOCKING: false
      ERROR: "Recommended workspace structure not found. Create 'apps/' and 'packages/' directories."
      FIX_COMMAND: "mkdir -p apps packages"
      DESCRIPTION: "Checks for the recommended apps/ and packages/ directories used by the workspace globs"
    </test>
    <test name="nvmrc_matches_node_version">
      TEST: test -f .nvmrc && grep -q "${NODE_VERSION}" .nvmrc
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["NODE_VERSION"]
      ERROR: "Node version mismatch. Ensure .nvmrc pins the project's Node version to ${NODE_VERSION}."
      FIX_COMMAND: "Create or update .nvmrc to contain exactly the required Node version (e.g., echo \"${NODE_VERSION}\" > .nvmrc)."
      DESCRIPTION: "Validates that the repository pins the expected Node version for consistent development environments"
    </test>
    <test name="env_example_exists">
      TEST: test -f .env.example
      REQUIRED: true
      BLOCKING: true
      ERROR: ".env.example is missing. Provide a template of required environment variables."
      FIX_COMMAND: "Create .env.example with the required keys documented in this project's setup."
      DESCRIPTION: "Ensures an environment template exists so developers can bootstrap local configuration"
    </test>
    <test name="env_example_contains_ports">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || grep -q "${PORT_WEB}.*${PORT_API}" .env.example
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE", "PORT_WEB", "PORT_API"]
      ERROR: ".env.example does not include the expected web and API port values (${PORT_WEB}, ${PORT_API})."
      FIX_COMMAND: "Add example port values to .env.example (e.g., NEXT_PUBLIC_APP_URL=http://localhost:${PORT_WEB}, API_URL=http://localhost:${PORT_API})."
      DESCRIPTION: "Requires environment template to include example web and API ports for greenfield projects"
      DEPENDS_ON: ["env_example_exists"]
    </test>
    <test name="pnpm_lockfile_exists">
      TEST: test -f pnpm-lock.yaml
      REQUIRED: false
      BLOCKING: false
      ERROR: "pnpm-lock.yaml not found. Ensure dependencies are installed with pnpm to generate a lockfile."
      FIX_COMMAND: "pnpm install"
      DESCRIPTION: "Advisory: presence of a pnpm lockfile helps reproducible installs"
      DEPENDS_ON: ["pnpm_workspace_config_exists"]
    </test>
    <test name="package_manager_pnpm_configured">
      TEST: grep -q '"packageManager"\s*:\s*"pnpm' package.json 2>/dev/null || test ! -f package.json
      REQUIRED: false
      BLOCKING: false
      ERROR: "packageManager field not set to pnpm in package.json. Consider declaring it for tooling consistency."
      FIX_COMMAND: "Add '"packageManager": "pnpm@10.16.0"' to package.json (root)"
      DESCRIPTION: "Advisory: declare pnpm as the package manager to guide tooling"
      DEPENDS_ON: ["pnpm_workspace_config_exists"]
    </test>
  </verification_definitions>
  
</verification-block>
