# TypeScript Configuration Standard

## Overview

This standard defines the exact TypeScript configuration requirements for all Engineering OS projects, with specific templates for different project types and monorepo structures.

> **Critical**: This standard provides **exact configuration files** that must be used as-is. Any deviations require architectural decision documentation.


## Base Configuration Template

### For Monorepo Projects (Phoenix Standard)

**File: `tsconfig.base.json`**
```json
{
  "compilerOptions": {
    // Core strict settings (REQUIRED - no exceptions)
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    
    // Enhanced strictness (REQUIRED for greenfield projects)
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitOverride": true,
    
    // Additional safety checks (REQUIRED)
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    // Modern JavaScript features (REQUIRED settings)
    "target": "ESNext",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    // Build output (REQUIRED for libraries)
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    // React configuration (REQUIRED for React projects)
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    
    // Module resolution
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    // Performance
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    
    // Path mapping for monorepo (PROJECT-SPECIFIC)
    "baseUrl": ".",
    "paths": {
      "@phoenix/*": ["packages/*/src"],
      "@phoenix/core/*": ["packages/core/src/*"],
      "@phoenix/contracts/*": ["packages/contracts/src/*"],
      "@phoenix/shared/*": ["packages/shared/src/*"]
    },
    
    // Build optimization
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage"
  ]
}
```

### Root TSConfig

**File: `tsconfig.json`**
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": [
    "packages/*/src/**/*",
    "packages/*/tests/**/*",
    "apps/*/src/**/*"
  ]
}
```

### Package-Level TSConfig Template

**File: `packages/*/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### Next.js App TSConfig

**File: `apps/web/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ]
}
```

## Domain Layer Configuration (Strictest)

For packages containing domain logic (core, entities), use the strictest configuration:

**File: `packages/core/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    // DOMAIN LAYER: Extra strict settings
    "exactOptionalPropertyTypes": true,
    "noErrorTruncation": true,
    "noImplicitReturns": true
  },
  "include": [
    "src/**/*"
  ]
}
```

## Configuration Rules

### MANDATORY Settings
These settings **CANNOT** be changed without architectural decision document:
- `"strict": true`
- `"strictNullChecks": true`
- `"noImplicitAny": true`
- `"target": "ESNext"` (not ES2022 or lower)
- `"jsx": "react-jsx"` (not "preserve")
- `"declaration": true`
- `"declarationMap": true`

### Project-Specific Variables
Replace these with actual project values:
- `@phoenix/*` → `@{PROJECT_NAME}/*`
- Package names in path mappings
- Port numbers in development URLs

### Forbidden Configurations
These settings are **PROHIBITED**:
- `"noImplicitAny": false`
- `"strict": false`
- `"skipLibCheck": false` (performance impact)
- `"target"` below ES2022
- `"jsx": "preserve"` (for React projects)

## Verification Tests

<!-- Verification block for TypeScript configuration compliance -->
<verification-block context-check="verification-typescript-config">
  <verification_definitions>
    <test name="typescript_config_exists">
      TEST: test -f tsconfig.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript configuration missing. Create tsconfig.json from template."
      FIX_COMMAND: "Copy tsconfig.json template from typescript-config.md standard"
      DESCRIPTION: "Verifies that a TypeScript configuration file exists in the project root"
    </test>
    <test name="typescript_strict_mode">
      TEST: grep -q '"strict": true' tsconfig.json || grep -q '"strict": true' tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript strict mode not enabled. This is mandatory for Engineering OS projects."
      FIX_COMMAND: "Add '\"strict\": true' to compilerOptions in tsconfig.json"
      BYPASS_REQUIRES: "Architectural decision document explaining why strict mode is disabled"
      DESCRIPTION: "Ensures TypeScript strict mode is enabled for maximum type safety"
    </test>
    <test name="typescript_strict_null_checks">
      TEST: grep -q '"strictNullChecks": true' tsconfig.json || grep -q '"strictNullChecks": true' tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript strictNullChecks not enabled. Required for null safety."
      FIX_COMMAND: "Add '\"strictNullChecks\": true' to compilerOptions"
      DESCRIPTION: "Validates that strictNullChecks is enabled to prevent null reference errors"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_target_esnext">
      TEST: grep -q '"target": "ESNext"' tsconfig.json || grep -q '"target": "ESNext"' tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript target must be ESNext, not ES2022 or lower. Found: $(grep -o '"target": "[^"]*"' tsconfig.json)"
      FIX_COMMAND: "Change target to '\"target\": \"ESNext\"' in compilerOptions"
      DESCRIPTION: "Ensures TypeScript targets the latest ECMAScript features for optimal performance"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_jsx_react_jsx">
      TEST: ! grep -q '"jsx"' tsconfig.json tsconfig.base.json 2>/dev/null || grep -q '"jsx": "react-jsx"' tsconfig.json tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "JSX must be 'react-jsx' for React projects, not 'preserve'. Found: $(grep -o '"jsx": "[^"]*"' tsconfig.json)"
      FIX_COMMAND: "Change jsx to '\"jsx\": \"react-jsx\"' in compilerOptions"
      DESCRIPTION: "Validates JSX transformation is configured for optimal React compilation"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_declaration_enabled">
      TEST: grep -q '"declaration": true' tsconfig.json || grep -q '"declaration": true' tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript declaration files not enabled. Required for library packages."
      FIX_COMMAND: "Add '\"declaration\": true' to compilerOptions"
      DESCRIPTION: "Ensures TypeScript generates .d.ts files for proper type definitions"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_declaration_map_enabled">
      TEST: grep -q '"declarationMap": true' tsconfig.json || grep -q '"declarationMap": true' tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript declaration maps not enabled. Required for debugging support."
      FIX_COMMAND: "Add '\"declarationMap\": true' to compilerOptions"
      DESCRIPTION: "Validates that declaration maps are generated for better debugging experience"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_no_implicit_any">
      TEST: grep -q '"noImplicitAny": true' tsconfig.json || grep -q '"noImplicitAny": true' tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript noImplicitAny not enabled. Required for type safety."
      FIX_COMMAND: "Add '\"noImplicitAny\": true' to compilerOptions"
      DESCRIPTION: "Ensures all variables have explicit types, preventing implicit any types"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_path_mappings">
      TEST: grep -q '@.*/*' tsconfig.json || grep -q '@.*/*' tsconfig.base.json
      REQUIRED: true
      BLOCKING: false
      ERROR: "No path mappings configured. Consider adding project-specific path aliases."
      FIX_COMMAND: "Add path mappings to compilerOptions.paths for better imports"
      DESCRIPTION: "Checks for path mappings that enable cleaner import statements"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_base_exists_if_workspace">
      TEST: test ! -f pnpm-workspace.yaml || test -f tsconfig.base.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Monorepo detected (pnpm-workspace.yaml present) but tsconfig.base.json is missing."
      FIX_COMMAND: "Create tsconfig.base.json using the template in typescript-config.md"
      DESCRIPTION: "Ensures monorepos include a shared base TSConfig to enforce consistent settings"
      DEPENDS_ON: ["typescript_config_exists"]
    </test>
    <test name="typescript_type_checking_passes">
      TEST: npx tsc --noEmit --skipLibCheck
      REQUIRED: true
      BLOCKING: true
      ERROR: "TypeScript type checking failed. Fix all type errors before proceeding."
      FIX_COMMAND: "Run 'npx tsc --noEmit' to see type errors and fix them"
      DESCRIPTION: "Validates that all TypeScript code compiles without errors in strict mode"
      DEPENDS_ON: ["typescript_config_exists", "typescript_strict_mode", "typescript_strict_null_checks", "typescript_no_implicit_any"]
    </test>
  </verification_definitions>
</verification-block>

## Common Issues and Fixes

### Issue: ES2022 Target Instead of ESNext
**Problem**: Using outdated target setting
**Fix**: Change `"target": "ES2022"` to `"target": "ESNext"`

### Issue: JSX Preserve Instead of react-jsx  
**Problem**: JSX transformation not optimized for React
**Fix**: Change `"jsx": "preserve"` to `"jsx": "react-jsx"`

### Issue: Missing Declaration Files
**Problem**: No type definitions generated for libraries
**Fix**: Add `"declaration": true` and `"declarationMap": true`

### Issue: Path Mappings Not Working
**Problem**: Import paths not resolving correctly
**Fix**: Ensure baseUrl is "." and paths match project structure

### Issue: Type Errors in Strict Mode
**Problem**: Code written without strict type checking fails
**Fix**: Incrementally fix type errors, don't disable strict mode

## Migration Guide

### From Non-Strict to Strict TypeScript

1. **Enable strict mode gradually**:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": false  // Temporarily allow, then fix
     }
   }
   ```

2. **Fix type errors incrementally**:
   - Start with `noImplicitAny: true`
   - Then enable `strictNullChecks: true` 
   - Finally enable all strict flags

3. **Update imports to use path mappings**:
   ```typescript
   // Before
   import { User } from '../../../domain/entities/User';
   
   // After  
   import { User } from '@phoenix/core/domain/entities/User';
   ```

## Integration with Build Tools

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@phoenix': path.resolve(__dirname, 'packages'),
      '@phoenix/core': path.resolve(__dirname, 'packages/core/src')
    }
  }
});
```

### Jest Configuration
```javascript
// jest.config.js  
module.exports = {
  moduleNameMapping: {
    '^@phoenix/(.*)$': '<rootDir>/packages/$1/src'
  }
};
```

This standard ensures consistent TypeScript configuration across all Engineering OS projects and prevents the configuration drift that led to Phoenix Phase 0 failures.
