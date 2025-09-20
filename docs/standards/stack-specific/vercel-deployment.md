# Vercel Deployment

> Vercel backs our preview environments and emergency fallback only. Azure Container Apps remains the production/primary hosting target per `docs/standards/stack-specific/azure-container-apps.md`. Keep configuration aligned with the "Preview Hosting" entry in `docs/standards/tech-stack.md`.

## When to Use Vercel
- Generate preview URLs for feature branches and QA sign-off.
- Spin up a temporary fallback if Azure Container Apps encounters a prolonged outage and the DR plan (`docs/runbooks/dr-failover.md`) calls for Vercel as an interim host.
- Validate edge-specific behaviour (Edge Runtime, Edge Functions) before porting logic to Azure Front Door + ACA.

Do **not** treat Vercel as the primary production platform. For long-lived incidents, follow the Azure failover runbook to restore service to ACA as soon as possible.

## Configuration

### vercel.json
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/*/route.ts": {
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    }
  ]
}
```

### Environment Variables
```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app
DATABASE_URL=postgres://...
REDIS_URL=redis://...
SENTRY_DSN=https://...
```

### Edge Functions
```typescript
// app/api/edge/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
  
  return Response.json({
    country,
    city,
    timestamp: new Date().toISOString(),
  });
}
```

### Build Optimization
```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['cdn.example.com'],
  },
  
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lodash', 'date-fns'],
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
```
