# Bundle Optimization

## Code Splitting Strategies

### Route-Based Splitting
```typescript
// Next.js automatic route splitting
// pages/dashboard.tsx
export default function Dashboard() {
  return <DashboardLayout />;
}

// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

### Component-Level Splitting
```typescript
// Lazy load heavy components
const RichTextEditor = lazy(() => 
  import('@/components/RichTextEditor')
);

function PostEditor() {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowEditor(true)}>
        Write Post
      </button>
      
      {showEditor && (
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor />
        </Suspense>
      )}
    </>
  );
}
```

### Library Splitting
```typescript
// Split large libraries
async function loadChartLibrary() {
  const { Chart } = await import('chart.js/auto');
  return Chart;
}

// Use dynamic imports for occasional features
async function exportToPDF() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // Generate PDF
}
```

## Tree Shaking

### ESM Imports
```typescript
// ✅ Tree-shakeable imports
import { debounce } from 'lodash-es';

// ❌ Imports entire library
import _ from 'lodash';

// Configure package.json for ESM
{
  "sideEffects": false, // Enable tree shaking
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Webpack Configuration
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    // Replace large libraries with smaller alternatives
    config.resolve.alias = {
      ...config.resolve.alias,
      'moment': 'dayjs',
      'lodash': 'lodash-es'
    };
    
    // Ignore unnecessary files
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/
      })
    );
    
    return config;
  }
};
```

## Bundle Analysis

### Setup Bundle Analyzer
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // config
});

// Run analysis
// ANALYZE=true pnpm build
```

### Monitoring Bundle Size
```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "size": "size-limit",
    "size:why": "size-limit --why"
  },
  "size-limit": [
    {
      "path": ".next/static/chunks/main-*.js",
      "limit": "150 KB"
    }
  ]
}
```

## Optimization Techniques

### Barrel File Optimization
```typescript
// ❌ Avoid barrel exports for large libraries
export * from './components'; // Imports everything

// ✅ Use specific exports
export { Button } from './Button';
export { Card } from './Card';

// ✅ Or use modularizeImports in Next.js
{
  "modularizeImports": {
    "@/components": {
      "transform": "@/components/{{member}}"
    }
  }
}
```

### Image Optimization
```typescript
// Use Next.js Image with optimization
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  quality={85} // Reduce quality for smaller size
  formats={['webp', 'avif']} // Modern formats
/>

// Responsive images
<Image
  src="/product.jpg"
  alt="Product"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
  fill
/>
```

### Font Subsetting
```css
/* Load only needed character sets */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;
  font-display: swap;
}
```