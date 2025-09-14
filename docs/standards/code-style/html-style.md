# HTML & JSX Style Guide

## Semantic HTML

### Use Appropriate Elements
```tsx
// ✅ Semantic elements
<header>
  <nav>
    <ul>
      <li><a href="/home">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <header>
      <h1>Article Title</h1>
      <time dateTime="2025-01-01">January 1, 2025</time>
    </header>
    <section>
      <h2>Section Title</h2>
      <p>Content...</p>
    </section>
  </article>
</main>

<footer>
  <p>&copy; 2025 Company Name</p>
</footer>

// ❌ Div soup
<div className="header">
  <div className="nav">
    <div className="nav-item">Home</div>
  </div>
</div>
```

## Accessibility

### ARIA Labels and Roles
```tsx
// ✅ Proper ARIA usage
<button 
  aria-label="Close dialog"
  aria-pressed={isPressed}
  onClick={handleClose}
>
  <XIcon aria-hidden="true" />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

<section aria-labelledby="section-title">
  <h2 id="section-title">Section Title</h2>
  {/* Content */}
</section>

// ✅ Live regions for dynamic content
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
>
  {message && <p>{message}</p>}
</div>
```

### Form Accessibility
```tsx
// ✅ Accessible form
<form onSubmit={handleSubmit}>
  <div>
    <label htmlFor="email">
      Email Address
      <span aria-label="required">*</span>
    </label>
    <input
      id="email"
      type="email"
      name="email"
      required
      aria-describedby="email-error"
      aria-invalid={!!errors.email}
    />
    {errors.email && (
      <span id="email-error" role="alert" className="error">
        {errors.email}
      </span>
    )}
  </div>
  
  <fieldset>
    <legend>Notification Preferences</legend>
    <label>
      <input type="checkbox" name="email-notifications" />
      Email notifications
    </label>
    <label>
      <input type="checkbox" name="sms-notifications" />
      SMS notifications
    </label>
  </fieldset>
  
  <button type="submit">Submit</button>
</form>
```
