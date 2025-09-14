# CSS & TailwindCSS Style Guide

## TailwindCSS v4.1.10+ Configuration

### CSS-First Configuration with Vite Plugin
```css
/* app.css */
@import "tailwindcss";

/* Scan source files for utility classes */
@source "src/**/*.{js,ts,jsx,tsx}";
@source "components/**/*.{js,ts,jsx,tsx}";

@theme {
  /* Colors using OKLCH for better color manipulation */
  --color-primary-50: oklch(0.95 0.02 250);
  --color-primary-100: oklch(0.90 0.04 250);
  --color-primary-500: oklch(0.55 0.22 250);
  --color-primary-900: oklch(0.25 0.20 250);
  
  /* Custom colors with proper OKLCH syntax */
  --color-brand-primary: oklch(0.65 0.15 240);
  --color-brand-secondary: oklch(0.75 0.12 120);
  
  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Typography with variable fonts */
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;
  --font-display: 'Satoshi Variable', sans-serif;
  
  /* Enhanced breakpoints */
  --breakpoint-xs: 30rem;
  --breakpoint-3xl: 120rem;
  
  /* Animation easing */
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
});
```

### Alternative PostCSS Configuration
```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

## Component Styling with CVA

### Variant-Based Components
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

## Utility Classes Organization

### Class Order Convention
```tsx
// 1. Layout
// 2. Flexbox/Grid
// 3. Spacing
// 4. Sizing
// 5. Typography
// 6. Background
// 7. Border
// 8. Effects
// 9. Transitions
// 10. Interactions

<div className="
  relative flex items-center justify-between
  p-4 mx-auto
  w-full max-w-7xl h-16
  text-sm font-medium
  bg-white dark:bg-gray-900
  border-b border-gray-200
  shadow-sm
  transition-all duration-200
  hover:shadow-md
">
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="
  grid grid-cols-1
  sm:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
  gap-4 sm:gap-6 lg:gap-8
">

// Responsive typography
<h1 className="
  text-2xl sm:text-3xl md:text-4xl lg:text-5xl
  font-bold tracking-tight
">
```

## Performance Optimization

### Critical CSS (v4.1.10+)
```css
/* Inline critical styles using CSS variables */
@layer base {
  .container {
    max-width: var(--breakpoint-7xl);
    margin-inline: auto;
    padding-inline: var(--spacing-4);
    
    @media (width >= var(--breakpoint-sm)) {
      padding-inline: var(--spacing-6);
    }
    
    @media (width >= var(--breakpoint-lg)) {
      padding-inline: var(--spacing-8);
    }
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}

/* Custom container utility for v4 */
@utility container {
  margin-inline: auto;
  padding-inline: var(--spacing-4);
  
  @media (width >= var(--breakpoint-sm)) {
    padding-inline: var(--spacing-6);
  }
}
```

### Lazy Loading
```tsx
// Conditionally load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded" />}>
  <HeavyComponent />
</Suspense>
```

## Dark Mode Implementation

### CSS Variable Approach (v4.1.10+)
```css
@theme {
  /* Light mode defaults */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.09 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.09 0 0);
  --color-border: oklch(0.89 0.005 247.858);
  
  /* Dark mode via media query */
  @media (prefers-color-scheme: dark) {
    --color-background: oklch(0.09 0 0);
    --color-foreground: oklch(0.98 0 0);
    --color-card: oklch(0.12 0 0);
    --color-card-foreground: oklch(0.95 0 0);
    --color-border: oklch(0.18 0.005 247.858);
  }
}

/* Manual dark mode class override */
@theme {
  .dark {
    --color-background: oklch(0.09 0 0);
    --color-foreground: oklch(0.98 0 0);
    --color-card: oklch(0.12 0 0);
    --color-card-foreground: oklch(0.95 0 0);
    --color-border: oklch(0.18 0.005 247.858);
  }
}
```

## Animation & Transitions

### Micro-interactions (v4.1.10+)
```tsx
// Hover states with custom easing
<button className="
  transform transition-all 
  hover:scale-105 hover:-translate-y-0.5
  active:scale-95
" style={{ 
  transitionTimingFunction: 'var(--ease-snappy)',
  transitionDuration: '200ms'
}}>

// Loading states with CSS variables
<div 
  className="animate-pulse bg-gradient-to-r"
  style={{
    background: `linear-gradient(90deg, 
      var(--color-gray-200), 
      var(--color-gray-300), 
      var(--color-gray-200)
    )`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite'
  }}
>

// Focus states using CSS variables
<input 
  className="focus:outline-none"
  style={{
    '--ring-color': 'var(--color-primary)',
    '--ring-offset': '2px',
    '&:focus': {
      boxShadow: `0 0 0 var(--ring-offset) var(--color-background), 
                  0 0 0 calc(2px + var(--ring-offset)) var(--ring-color)`,
      borderColor: 'var(--color-primary)'
    }
  }}
/>
```

### Custom Animations
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Accessibility

### Focus Management
```tsx
// Visible focus indicators
<button className="
  focus:outline-none focus:ring-2 focus:ring-primary
  focus:ring-offset-2 focus:ring-offset-background
">

// Skip links
<a 
  href="#main-content"
  className="
    sr-only focus:not-sr-only
    focus:absolute focus:top-4 focus:left-4
    bg-primary text-primary-foreground
    px-4 py-2 rounded-md z-50
  "
>
  Skip to main content
</a>
```

### High Contrast Support
```css
@media (prefers-contrast: high) {
  .button {
    @apply border-2 border-current;
  }
  
  .card {
    @apply border border-current;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Best Practices

### Class Naming
- Use semantic class names for reusable components
- Avoid deep nesting of utility classes
- Group related utilities logically
- Use CSS custom properties for dynamic values

### Performance
- Minimize unused CSS with PurgeCSS
- Use `@layer` directives for proper cascade
- Prefer CSS custom properties over inline styles
- Lazy load non-critical CSS

### Maintainability
- Document color scales and spacing
- Use consistent naming conventions
- Avoid magic numbers in spacing/sizing
- Test across different screen sizes and devices
