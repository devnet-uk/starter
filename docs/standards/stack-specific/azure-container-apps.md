# Azure Container Apps Deployment

> Engineering OS deploys production workloads to Azure Container Apps (ACA) with Azure Front Door, Azure Container Registry (ACR), Azure Key Vault, and Azure Monitor as defined in `docs/standards/tech-stack.md`. Treat this document as the canonical runbook for packaging Next.js (standalone output) and backend services into ACA, orchestrating revisions, and wiring observability and security.

## Guiding Principles
- Provision infrastructure as code (IaC) via Bicep or Terraform under `infra/azure/`, and manage lifecycle with Azure Developer CLI (`azd`) and GitHub Actions. Manual portal changes must be codified immediately.
- Separate workloads by environment: one ACA managed environment per stage (dev, preview, prod) inside dedicated resource groups. Share ACR across environments but isolate log analytics workspaces to respect retention policies.
- Tag every resource (e.g., `environment`, `cost-center`, `service`) and enforce budgets with Azure Cost Management alerts. Treat scale-to-zero and KEDA autoscaling as the default for API and job containers.
- Prefer Azure-managed identities over secrets. Pull image from ACR using managed identity, resolve secrets from Key Vault at runtime, and guard outbound access with Azure Firewall rules.
- Keep networking layered: private VNet-integrated Container Apps, Azure Front Door Standard as the global entry point, and private endpoints for data stores (PostgreSQL, Redis, AI Search). Expose edge traffic only through Front Door.
- Align operational practices with other standards: Next.js frontend output must be standalone (`docs/standards/stack-specific/nextjs-frontend.md`), background jobs follow `architecture/background-job-patterns.md`, and observability plugs into `performance/observability.md`.
- Treat Vercel as preview-only/backup hosting; any fallback to Vercel must be temporary and tracked in `docs/runbooks/dr-failover.md`.

## Environment Architecture
- **Resource groups**: `rg-eos-{env}` (dev, preview, prod). Keep shared services (ACR, Container Apps environment, Log Analytics) per resource group for simplified RBAC.
- **Container Apps environment**: provision with Workload Profiles for compute tiers (e.g., `Consumption`, `Dedicated`). Use the same environment per stage to enable internal service discovery.
- **Networking**: integrate ACA environment with a VNet containing subnets for container apps, data services, and private endpoints. Enable VNet egress locking to control outbound traffic.
- **Front Door**: route `https://app.example.com` to ACA ingress, configure Web Application Firewall (WAF) rules, and enable session affinity only when necessary. Use Azure DNS for custom domains and managed certificates.
- **Image registry**: push images to a single ACR (`acrEngineeringOs`) with retention policies and content trust. Configure `az acr build` or GitHub Actions to build multi-arch images when required.

### IaC Layout
```
infra/azure/
├── main.bicep               # Root deployment (resource groups, ACR, ACA env)
├── modules/
│   ├── container-app.bicep   # Reusable module for web/api workloads
│   ├── job.bicep             # ACA jobs (scheduled/batch)
│   └── monitoring.bicep      # Log Analytics, alerts, dashboards
├── environments/
│   ├── dev.bicep
│   ├── preview.bicep
│   └── prod.bicep
└── azure.yaml                # azd environment configuration
```
- Keep parameter files (`dev.parameters.json`, etc.) alongside environment files. Never hardcode secrets; reference Key Vault secret URIs.
- Use `azd pipeline config` to bootstrap GitHub Actions that deploy on push/merge with OIDC-based federation.

## Build and Release Flow
- Build images in CI using `docker buildx` or Azure Container Registry Tasks. Tag with `${GITHUB_SHA}` and `latest` per environment.
- Authenticate GitHub Actions to Azure via workload identity federation (`azure/login@v2` with `client-id`, `tenant-id`, `subscription-id` secrets).
- Deploy with `az deployment sub create` (Bicep) or `terraform apply` before running `az containerapp update`. Ensure deployments are idempotent.
- Use ACA revisions for zero-downtime rollouts. Enable automatic traffic splitting (100% to latest revision) and keep at least one previous revision active for instant rollback. Tag revisions with the Git commit SHA.
- Jobs (`az containerapp job`) run scheduled tasks through KEDA Cron or Azure Event Grid. Use separate repositories or modules for long-running workers and scale to zero when idle.

### GitHub Actions Snippet
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - name: Build and push image
        run: |
          az acr build --registry acrEngineeringOs --image web:${{ github.sha }} .
      - name: Deploy infrastructure
        run: |
          az deployment sub create \
            --template-file infra/azure/main.bicep \
            --location centralus \
            --parameters environment=prod
      - name: Update container app
        run: |
          az containerapp update \
            --name web \
            --resource-group rg-eos-prod \
            --image acrEngineeringOs.azurecr.io/web:${{ github.sha }}
```

## Configuration and Secrets
- Prefer YAML-based declarative configuration passed via `aca.yaml` or Bicep modules. Keep environment variables minimal and document in `docs/runbooks/configuration.md`.
- Mount configuration and secrets from Key Vault references. Enable diagnostics to capture secret access failures.
- Store connection strings (PostgreSQL, Redis) in Key Vault and inject via managed identity. Never bake them into images.
- Set health probes (`liveness`, `readiness`, `startup`) on every app. Use `/api/healthz` endpoints that hit essential dependencies.
- Configure data persistence via Azure Files volumes or external services. Avoid local ephemeral storage for user uploads.

## Scaling, Resilience, and Cost
- Define min/max replicas per workload. For Next.js frontend: `minReplicas: 1` (prod) to avoid cold starts, `maxReplicas: 10` with HTTP concurrency triggers.
- Use KEDA HTTP-based autoscaling or queue triggers (BullMQ, Service Bus) for background workers. Keep CPU/memory balanced per workload profile.
- Enable revision garbage collection to limit total revisions (e.g., keep last 5). Schedule nightly `az containerapp revision label cleanup` job if necessary.
- Configure disaster recovery with backup ACR replication and exportable Bicep templates. Document failover steps in `docs/runbooks/dr-failover.md`.
- Use Azure Cost Management budgets with alert thresholds (80%, 100%).

## Observability and Compliance
- Stream logs and metrics to Log Analytics. Create saved Kusto queries for key services and feed them into Azure Monitor workbooks.
- Enable distributed tracing via OpenTelemetry exporters in `instrumentation.ts`, pushing to Azure Monitor (Application Insights) through OTLP.
- Use Azure Monitor alerts for HTTP 5xx spikes, CPU saturation, failure counts, and container restarts. Pipe alerts to Teams or PagerDuty.
- Enable Microsoft Defender for Cloud recommendations and fix outstanding issues before production go-live.
- Record compliance evidence (WAF rules, retention policies, RBAC assignments) in `docs/compliance/`.

## Related Standards
- `docs/standards/stack-specific/nextjs-frontend.md`
- `docs/standards/stack-specific/vercel-deployment.md`
- `docs/standards/performance/observability.md`
- `docs/standards/security/security.md`
- `docs/standards/architecture/background-job-patterns.md`

<verification-block context-check="aca-deployment-verification">
  <verification_definitions>
    <test name="azure_infra_directory_present">
      TEST: test -d infra/azure || test -d infrastructure/azure
      REQUIRED: true
      ERROR: "Create an infra/azure directory (or infrastructure/azure) with Bicep/Terraform definitions for Container Apps."
      DESCRIPTION: "Ensures Azure infrastructure as code lives in a dedicated workspace directory."
    </test>
    <test name="container_app_definition_present">
      TEST: rg --max-count 1 "containerapp" infra/azure --glob "*.bicep" --glob "*.tf"
      REQUIRED: true
      ERROR: "Define a container app resource (Bicep or Terraform) so deployments can target Azure Container Apps."
      DESCRIPTION: "Verifies infrastructure code defines at least one Azure Container App."
    </test>
    <test name="log_analytics_configured">
      TEST: rg --max-count 1 "logAnalytics" infra/azure --glob "*.bicep" --glob "*.tf" || rg --max-count 1 "log_analytics_workspace" infra/azure --glob "*.tf"
      REQUIRED: false
      ERROR: "Add Log Analytics/Monitor resources to capture ACA logs and metrics."
      DESCRIPTION: "Encourages wiring observability resources alongside Container Apps."
    </test>
    <test name="azure_pipeline_defined">
      TEST: rg --max-count 1 "az containerapp" .github/workflows --glob "*.yml" --glob "*.yaml"
      REQUIRED: false
      ERROR: "Add a GitHub Actions workflow that deploys to Azure Container Apps using az CLI."
      DESCRIPTION: "Checks for automated deployment pipelines targeting ACA."
    </test>
  </verification_definitions>
</verification-block>
