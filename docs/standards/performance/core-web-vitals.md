# Core Web Vitals Optimization

## Metrics & Targets

### Largest Contentful Paint (LCP)
Target: < 2.5 seconds

#### Optimization Strategies
```typescript
// Priority hints for critical images
<img
  src="/hero.jpg"
  alt="Hero"
  fetchpriority="high"
  loading="eager"
/>

// Preload critical resources
<link
  rel="preload"
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>

// Next.js Image optimization
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority // Preload this image
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### Interaction to Next Paint (INP)
Target: < 200 milliseconds

#### Optimization Strategies
```typescript
// Debounce expensive operations
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);

// Use transitions for non-urgent updates
import { useTransition } from 'react';

function SearchResults() {
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (query: string) => {
    startTransition(() => {
      setSearchResults(performSearch(query));
    });
  };
}

// Virtualize long lists
import { VirtualList } from '@tanstack/react-virtual';

function LongList({ items }: { items: Item[] }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  });
}
```

### Cumulative Layout Shift (CLS)
Target: < 0.1

#### Prevention Strategies
```typescript
// Reserve space for dynamic content
<div className="aspect-video bg-gray-100">
  <Image
    src={imageUrl}
    alt="Dynamic content"
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>

// Skeleton loaders for async content
function PostSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

// Fixed dimensions for ads/embeds
<div 
  className="w-full h-[250px]" 
  data-ad-slot="123"
/>
```

## Measurement & Monitoring

### Real User Monitoring (RUM)
```typescript
// utils/webVitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

function sendToAnalytics(metric: Metric) {
  // Send to your analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now()
    })
  });
}
```

### Performance Observer
```typescript
// Monitor long tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long task detected:', {
        duration: entry.duration,
        startTime: entry.startTime,
        name: entry.name
      });
    }
  }
});

observer.observe({ entryTypes: ['longtask'] });
```

## Resource Loading Strategy

### Critical CSS
```html
<!-- Inline critical CSS -->
<style>
  /* Above-the-fold styles */
  .hero { ... }
  .nav { ... }
</style>

<!-- Async load non-critical CSS -->
<link 
  rel="preload" 
  href="/styles/main.css" 
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
```

### JavaScript Loading
```html
<!-- Defer non-critical scripts -->
<script src="/scripts/analytics.js" defer></script>

<!-- Module scripts are deferred by default -->
<script type="module" src="/scripts/app.js"></script>

<!-- Lazy load on interaction -->
<script>
  button.addEventListener('click', () => {
    import('./heavy-feature.js').then(module => {
      module.initialize();
    });
  }, { once: true });
</script>
```

### Font Loading
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap; /* Avoid invisible text */
  font-weight: 400 900;
  unicode-range: U+0000-00FF; /* Latin subset */
}
```

## Performance Budgets

### Bundle Size Limits
```javascript
// .size-limit.json
[
  {
    "path": ".next/static/chunks/main-*.js",
    "limit": "150 KB"
  },
  {
    "path": ".next/static/chunks/pages/**/*.js",
    "limit": "100 KB"
  },
  {
    "path": ".next/static/css/*.css",
    "limit": "50 KB"
  }
]
```

### Lighthouse CI Config
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }]
      }
    }
  }
};
```
