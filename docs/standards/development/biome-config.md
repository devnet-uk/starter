# BiomeJS Configuration Standard

## Overview

This standard defines the exact BiomeJS configuration for all Engineering OS projects, with **zero tolerance for quality downgrades** in domain layers.

Engineering OS teams must run the **latest stable Biome release** (or the published LTS tag when Biome designates one). Confirm the installed version before generating configs, and update this standard when a new stable/LTS release introduces material rule changes.

> **Critical**: Domain layer packages MUST maintain the strictest BiomeJS settings. Any overrides weakening domain quality are prohibited.


## Base Configuration Template

### Standard BiomeJS Configuration

**File: `biome.json`** (replace `{{BIOME_VERSION}}` with the installed Biome version)
```json
{
  "$schema": "https://biomejs.dev/schemas/{{BIOME_VERSION}}/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "ignore": [
      "**/*.md",
      "**/*.json",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**"
    ]
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "error",
        "noMultipleSpacesInRegularExpressionLiterals": "error",
        "noUselessCatch": "error",
        "noUselessConstructor": "error",
        "noUselessLoneBlockStatements": "error",
        "noUselessRename": "error",
        "noUselessSwitchCase": "error",
        "noWith": "error"
      },
      "correctness": {
        "noChildrenProp": "error",
        "noConstAssign": "error",
        "noConstantCondition": "error",
        "noConstructorReturn": "error",
        "noEmptyCharacterClassInRegex": "error",
        "noEmptyPattern": "error",
        "noGlobalObjectCalls": "error",
        "noInvalidConstructorSuper": "error",
        "noInvalidNewBuiltin": "error",
        "noNonoctalDecimalEscape": "error",
        "noPrecisionLoss": "error",
        "noSelfAssign": "error",
        "noSetterReturn": "error",
        "noSwitchDeclarations": "error",
        "noUndeclaredVariables": "error",
        "noUnreachable": "error",
        "noUnreachableSuper": "error",
        "noUnsafeFinally": "error",
        "noUnsafeOptionalChaining": "error",
        "noUnusedLabels": "error",
        "noUnusedPrivateClassMembers": "error",
        "noUnusedVariables": "error",
        "useArrayLiterals": "error",
        "useIsNan": "error",
        "useValidForDirection": "error",
        "useYield": "error"
      },
      "style": {
        "noArguments": "error",
        "noCommaOperator": "error",
        "noDefaultExport": "off",
        "noImplicitBoolean": "error",
        "noInferrableTypes": "error",
        "noNamespace": "error",
        "noNonNullAssertion": "error",
        "noParameterAssign": "error",
        "noRestrictedGlobals": "error",
        "noUnusedTemplateLiteral": "error",
        "noVar": "error",
        "useBlockStatements": "error",
        "useCollapsedElseIf": "error",
        "useConst": "error",
        "useDefaultParameterLast": "error",
        "useEnumInitializers": "error",
        "useExponentiationOperator": "error",
        "useFragmentSyntax": "error",
        "useNamedParameters": "error",
        "useNumericLiterals": "error",
        "useShorthandArrayType": "error",
        "useShorthandAssign": "error",
        "useSingleVarDeclarator": "error",
        "useTemplate": "error"
      },
      "suspicious": {
        "noApproximativeNumericConstant": "error",
        "noArrayIndexKey": "error",
        "noAssignInExpressions": "error",
        "noAsyncPromiseExecutor": "error",
        "noCatchAssign": "error",
        "noClassAssign": "error",
        "noCommentText": "error",
        "noCompareNegZero": "error",
        "noConsoleLog": "error",
        "noControlCharactersInRegex": "error",
        "noDebugger": "error",
        "noDuplicateCase": "error",
        "noDuplicateClassMembers": "error",
        "noDuplicateObjectKeys": "error",
        "noDuplicateParameters": "error",
        "noEmptyBlockStatements": "error",
        "noExplicitAny": "error",
        "noExtraNonNullAssertion": "error",
        "noFallthroughSwitchClause": "error",
        "noFunctionAssign": "error",
        "noGlobalAssign": "error",
        "noImportAssign": "error",
        "noLabelVar": "error",
        "noMisleadingCharacterClass": "error",
        "noMisleadingInstantiator": "error",
        "noPrototypeBuiltins": "error",
        "noRedeclare": "error",
        "noSelfCompare": "error",
        "noShadowRestrictedNames": "error",
        "noUnsafeDeclarationMerging": "error",
        "noUnsafeNegation": "error",
        "useGetterReturn": "error",
        "useValidTypeof": "error"
      },
      "a11y": {
        "recommended": true
      },
      "security": {
        "noDangerouslySetInnerHtml": "error",
        "noDangerouslySetInnerHtmlWithChildren": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  },
  "json": {
    "formatter": {
      "enabled": true,
      "indentStyle": "space",
      "indentWidth": 2
    }
  }
}
```

> Replace `{{BIOME_VERSION}}` with the version string reported by `npx @biomejs/biome --version` (for example, `2.2.4`). Keeping schema and CLI versions aligned avoids false diagnostics during validation.

## Domain Layer Override Protection

### ❌ PROHIBITED: Quality Downgrades

The following configuration is **ABSOLUTELY FORBIDDEN** for domain packages:

```json
// ❌ NEVER DO THIS - Weakens domain quality
{
  "overrides": [
    {
      "include": ["packages/core/**/*"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "warn",      // ❌ FORBIDDEN: Must be "error"
            "noNonNullAssertion": "warn"  // ❌ FORBIDDEN: Must be "error"
          }
        }
      }
    }
  ]
}
```

### ✅ REQUIRED: Strictest Settings for Domain

Domain layer packages (core, entities, domain) MUST maintain highest quality:

```json
{
  "overrides": [
    {
      "include": ["packages/core/**/*", "packages/domain/**/*"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "error",
            "noConsoleLog": "error",
            "noDebugger": "error"
          },
          "style": {
            "noNonNullAssertion": "error",
            "noImplicitBoolean": "error"
          },
          "correctness": {
            "noUnusedVariables": "error"
          }
        }
      }
    }
  ]
}
```

## Package-Specific Configurations

### Infrastructure Layer (More Lenient)

```json
{
  "overrides": [
    {
      "include": ["packages/infrastructure/**/*"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsoleLog": "warn",  // Allow logging in infrastructure
            "noExplicitAny": "error" // Still strict on types
          }
        }
      }
    }
  ]
}
```

### UI Layer (Component-Specific Rules)

```json
{
  "overrides": [
    {
      "include": ["packages/ui/**/*", "apps/web/**/*"],
      "linter": {
        "rules": {
          "style": {
            "noDefaultExport": "off",    // Allow default exports for components
            "useNamedParameters": "warn" // More lenient for props
          },
          "a11y": {
            "recommended": true,
            "useKeyWithClickEvents": "error"
          }
        }
      }
    }
  ]
}
```

### Test Files (Relaxed Rules)

```json
{
  "overrides": [
    {
      "include": ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "warn",
            "noConsoleLog": "off"
          },
          "style": {
            "noNonNullAssertion": "warn"
          }
        }
      }
    }
  ]
}
```

## Verification Tests

<!-- Verification block for BiomeJS configuration compliance -->
<verification-block context-check="verification-biome-config">
  <verification_definitions>
    <test name="biome_config_exists">
      TEST: test -f biome.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "BiomeJS configuration missing. Create biome.json from template."
      FIX_COMMAND: "Copy biome.json template from biome-config.md standard"
      DESCRIPTION: "Verifies that a BiomeJS configuration file exists in the project root"
    </test>
    <test name="biome_linter_enabled">
      TEST: grep -q '"enabled": true' biome.json | head -1
      REQUIRED: true
      BLOCKING: true
      ERROR: "BiomeJS linter not enabled. Linting is mandatory for code quality."
      FIX_COMMAND: "Set '\"enabled\": true' in linter section of biome.json"
      DESCRIPTION: "Ensures BiomeJS linting is enabled for code quality enforcement"
      DEPENDS_ON: ["biome_config_exists"]
    </test>
    <test name="biome_formatter_enabled">
      TEST: grep -A 5 '"formatter"' biome.json | grep -q '"enabled": true'
      REQUIRED: true
      BLOCKING: true
      ERROR: "BiomeJS formatter not enabled. Consistent formatting is required."
      FIX_COMMAND: "Set '\"enabled\": true' in formatter section of biome.json"
      DESCRIPTION: "Validates that BiomeJS code formatting is enabled for consistent style"
      DEPENDS_ON: ["biome_config_exists"]
    </test>
    <test name="biome_no_explicit_any_error">
      TEST: ! grep -A 20 'packages/core' biome.json | grep -q '"noExplicitAny": "warn"' && ! grep -A 20 'packages/domain' biome.json | grep -q '"noExplicitAny": "warn"'
      REQUIRED: true
      BLOCKING: true
      ERROR: "Domain layer has noExplicitAny downgraded to 'warn'. Domain must have strictest settings ('error')."
      FIX_COMMAND: "Remove or change noExplicitAny override for domain packages to 'error'"
      DESCRIPTION: "Ensures domain packages maintain strictest type safety (no 'any' types allowed)"
      DEPENDS_ON: ["biome_config_exists"]
    </test>
    <test name="biome_no_non_null_assertion_error">
      TEST: ! grep -A 20 'packages/core' biome.json | grep -q '"noNonNullAssertion": "warn"' && ! grep -A 20 'packages/domain' biome.json | grep -q '"noNonNullAssertion": "warn"'
      REQUIRED: true
      BLOCKING: true
      ERROR: "Domain layer has noNonNullAssertion downgraded to 'warn'. Domain must have strictest settings ('error')."
      FIX_COMMAND: "Remove or change noNonNullAssertion override for domain packages to 'error'"
      DESCRIPTION: "Validates that domain packages prohibit unsafe non-null assertions"
      DEPENDS_ON: ["biome_config_exists"]
    </test>
    <test name="biome_check_passes">
      TEST: npx @biomejs/biome check . --reporter=summary
      REQUIRED: true
      BLOCKING: true
      ERROR: "BiomeJS check failed. Fix all linting and formatting issues."
      FIX_COMMAND: "Run 'npx @biomejs/biome check . --apply' to fix auto-fixable issues, then manually fix remaining issues"
      DESCRIPTION: "Executes BiomeJS check to validate all code meets quality standards"
      DEPENDS_ON: ["biome_config_exists", "biome_linter_enabled", "biome_formatter_enabled"]
    </test>
    <test name="biome_no_console_log_domain">
      TEST: ! find packages/core packages/domain -name "*.ts" -type f 2>/dev/null | xargs grep -l "console\." 2>/dev/null | head -1
      REQUIRED: true
      BLOCKING: true
      ERROR: "Console statements found in domain layer. Domain code must be free of side effects."
      FIX_COMMAND: "Remove all console.log/error/warn statements from domain packages"
      DESCRIPTION: "Ensures domain layer is free of console statements (pure domain code)"
      DEPENDS_ON: ["biome_config_exists"]
    </test>
    <test name="biome_organizeImports_enabled">
      TEST: grep -q '"organizeImports"' biome.json && grep -A 3 '"organizeImports"' biome.json | grep -q '"enabled": true'
      REQUIRED: true
      BLOCKING: false
      ERROR: "Import organization not enabled. This improves code consistency."
      FIX_COMMAND: "Add '\"organizeImports\": { \"enabled\": true }' to biome.json"
      DESCRIPTION: "Checks that import organization is enabled for consistent import ordering"
      DEPENDS_ON: ["biome_config_exists"]
    </test>
  </verification_definitions>
</verification-block>

## Integration with Package Scripts

### Required Package.json Scripts

All packages MUST have these scripts (not echo statements). `ci` runs Biome's unified pipeline and is required for parity with Engineering OS governance checks:

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check . --apply",
    "format": "biome format . --write",
    "check": "biome check . --apply-unsafe",
    "ci": "biome ci ."
  }
}
```

### ❌ PROHIBITED: Fake Scripts

The following are **NEVER ACCEPTABLE**:

```json
{
  "scripts": {
    "lint": "echo 'BiomeJS linting - Phase 0 Step 3'",  // ❌ FAKE
    "format": "echo 'Formatting complete'",              // ❌ FAKE
    "check": "true",                                     // ❌ FAKE
    "ci": "echo 'CI green'"                              // ❌ FAKE
  }
}
```

## Common Violations and Fixes

### Violation: Downgrading Domain Quality

**Problem**: Core package has `"noExplicitAny": "warn"`
**Fix**: Remove override or change to `"error"`

### Violation: Console Statements in Domain

**Problem**: `console.log` found in domain entities
**Fix**: Remove all console statements, use proper logging abstractions

### Violation: Disabled Rules for Convenience

**Problem**: Rules disabled because of existing violations
**Fix**: Fix violations instead of disabling rules

### Violation: Inconsistent Rule Configuration

**Problem**: Different rules for similar packages
**Fix**: Standardize rule configuration by layer

## Rule Categories by Layer

### Domain Layer (Strictest)
- `noExplicitAny`: **error**
- `noConsoleLog`: **error**
- `noNonNullAssertion`: **error**
- `noDebugger`: **error**
- All complexity rules: **error**

### Use Cases Layer (Strict)
- `noExplicitAny`: **error**
- `noConsoleLog`: **error**
- `noNonNullAssertion`: **error**

### Infrastructure Layer (Moderate)
- `noExplicitAny`: **error**
- `noConsoleLog`: **warn** (logging allowed)
- `noNonNullAssertion`: **error**

### UI Layer (Component-Friendly)
- `noExplicitAny`: **error**
- `noConsoleLog`: **warn**
- `noDefaultExport`: **off** (components need default exports)

### Test Files (Relaxed)
- `noExplicitAny`: **warn**
- `noConsoleLog`: **off**
- `noNonNullAssertion`: **warn**

## Performance Configuration

### Optimal Settings for Large Codebases

```json
{
  "linter": {
    "enabled": true,
    "ignore": [
      "**/*.min.js",
      "**/*.d.ts",
      "**/generated/**",
      "**/*.config.js"
    ]
  },
  "formatter": {
    "ignore": [
      "**/*.md",
      "CHANGELOG.md",
      "**/*.min.js"
    ]
  }
}
```

## Migration from ESLint/Prettier

### Automated Migration

```bash
# Remove old tools
npm uninstall eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Install the latest stable Biome (use @lts if Biome publishes an LTS tag)
npm install --save-dev @biomejs/biome@latest

# Initialize configuration
npx @biomejs/biome init

# Migrate existing config
npx @biomejs/biome migrate eslint --write
```

### Configuration Equivalents

| ESLint Rule | BiomeJS Rule |
|-------------|--------------|
| `@typescript-eslint/no-explicit-any` | `noExplicitAny` |
| `@typescript-eslint/no-non-null-assertion` | `noNonNullAssertion` |
| `no-console` | `noConsoleLog` |
| `no-debugger` | `noDebugger` |
| `no-unused-vars` | `noUnusedVariables` |

This standard ensures consistent BiomeJS configuration and prevents the quality downgrades that led to Phoenix Phase 0 domain layer violations.
