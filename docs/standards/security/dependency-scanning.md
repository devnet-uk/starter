# Dependency Scanning

## Automated Security Scanning

### GitHub Actions Security Workflow
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium
      
      - name: Run npm audit
        run: |
          pnpm audit --audit-level=moderate
          
      - name: Run Socket Security
        uses: socketdev/socket-security-action@v1
        with:
          socket-token: ${{ secrets.SOCKET_TOKEN }}
      
      - name: Upload results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: snyk.sarif

  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check licenses
        run: |
          npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;BSD-2-Clause;ISC"

  secret-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Local Security Checks
```json
// package.json
{
  "scripts": {
    "security:audit": "pnpm audit --audit-level=moderate",
    "security:snyk": "snyk test",
    "security:licenses": "license-checker --production --summary",
    "security:secrets": "gitleaks detect --source . --verbose",
    "security:all": "pnpm run security:audit && pnpm run security:snyk && pnpm run security:licenses"
  }
}
```

## Dependency Update Strategy

### Automated Updates with Renovate
```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:base",
    ":dependencyDashboard",
    ":semanticCommitTypeAll(chore)"
  ],
  "schedule": ["after 2am", "before 6am"],
  "timezone": "UTC",
  "packageRules": [
    {
      "matchDepTypes": ["dependencies"],
      "matchUpdateTypes": ["patch", "minor"],
      "automerge": true,
      "automergeType": "pr"
    },
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["breaking"]
    },
    {
      "matchPackagePatterns": ["^@types/"],
      "automerge": true,
      "schedule": ["at any time"]
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "automerge": true
  }
}
```

### Security Policy
```markdown
# SECURITY.md

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

Email: security@yourcompany.com
Response Time: 48 hours

### Process
1. Report vulnerability via email
2. Receive acknowledgment within 48 hours
3. We investigate and develop fix
4. Coordinated disclosure after patch

## Security Measures

- Dependencies updated monthly
- Security scanning on every PR
- Penetration testing quarterly
- Bug bounty program available
```
