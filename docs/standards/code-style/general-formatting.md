# General Code Formatting Standards

## Overview
Universal formatting guidelines that apply across all languages and frameworks in the project.

## General Formatting

### Indentation
- Use 2 spaces for indentation (never tabs)
- Maintain consistent indentation
- Align nested structures for readability

### Line Length
- Maximum 100 characters for code
- Maximum 80 characters for comments
- Break at logical points

### File Organization
- Follow Clean Architecture layers
- One export per file for major components
- Group related functionality

## Verification Rules

<verification-block context-check="general-formatting-verification">
  <verification_definitions>
    <test name="no_tabs_in_code">
      TEST: ! find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l $'\t'
      REQUIRED: true
      ERROR: "Code files must use spaces, not tabs for indentation. Run: sed -i 's/\t/  /g' file.ext"
      DESCRIPTION: "Ensures consistent indentation using spaces across all code files"
    </test>
    <test name="line_length_compliance">
      TEST: find . -name "*.ts" -o -name "*.tsx" | xargs awk 'length > 100 { print FILENAME ":" NR ":" $0; exit 1 }'
      REQUIRED: false
      ERROR: "Consider breaking long lines at logical points to stay under 100 characters"
      DESCRIPTION: "Monitors code line length for readability"
    </test>
    <test name="consistent_file_organization">
      TEST: find . -name "index.ts" | xargs grep -l "export.*from.*\.\/" | head -1
      REQUIRED: false
      ERROR: "Ensure index files use consistent export patterns"
      DESCRIPTION: "Validates consistent file organization and export patterns"
    </test>
  </verification_definitions>
</verification-block>

## Best Practices

### File Naming
- Use kebab-case for file names (`user-service.ts`)
- Use PascalCase for component files (`UserProfile.tsx`)
- Use camelCase for utility files (`formatDate.ts`)

### Code Organization
- Group imports: external libraries, internal modules, relative imports
- Separate logical sections with blank lines
- Use consistent spacing around operators and after commas

### Comments and Documentation
- Write self-documenting code first
- Add comments for business logic and complex algorithms
- Use JSDoc for public APIs and exported functions
- Avoid obvious comments that duplicate the code