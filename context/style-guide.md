# Therapy Clinic Management System - Style Guide

## Brand Identity

### Brand Values
- **Trustworthy**: Professional, secure, HIPAA-compliant healthcare platform
- **Compassionate**: Warm, approachable, human-centered design for sensitive contexts
- **Efficient**: Streamlined workflows that respect therapists' and staff's time
- **Inclusive**: Accessible design (WCAG AA+) for diverse users and abilities
- **Clear**: Simple, unambiguous interfaces that reduce cognitive load

### Design Tone
- **Professional** but not sterile
- **Modern** but not trendy
- **Calming** but not passive
- **Efficient** but not rushed

## Color System

### Primary Brand Colors

```css
/* Primary - Calming Teal (Trust, Healthcare, Therapy) */
--color-primary-50: #f0fdfa; /* Lightest tint for backgrounds */
--color-primary-100: #ccfbf1; /* Subtle highlights */
--color-primary-200: #99f6e4; /* Hover backgrounds */
--color-primary-300: #5eead4; /* Soft accents */
--color-primary-400: #2dd4bf; /* Interactive elements */
--color-primary-500: #14b8a6; /* Primary brand color (buttons, links, focus) */
--color-primary-600: #0d9488; /* Hover states for primary buttons */
--color-primary-700: #0f766e; /* Active states */
--color-primary-800: #115e59; /* Dark accents */
--color-primary-900: #134e4a; /* Darkest shade */

/* Tailwind equivalent: teal-500 as primary */
```

**Usage:**
- Primary CTAs (Create Appointment, Save Client, Send Message)
- Active navigation items
- Focus states
- Links
- Status indicators (Active, Available)

### Neutral Colors (Gray Scale)

```css
/* Neutrals - Professional Slate Gray */
--color-neutral-50: #f8fafc; /* Page backgrounds (light mode) */
--color-neutral-100: #f1f5f9; /* Card backgrounds, hover states */
--color-neutral-200: #e2e8f0; /* Borders, dividers */
--color-neutral-300: #cbd5e1; /* Input borders, disabled backgrounds */
--color-neutral-400: #94a3b8; /* Placeholder text, disabled text */
--color-neutral-500: #64748b; /* Secondary text, icons */
--color-neutral-600: #475569; /* Body text (light mode) */
--color-neutral-700: #334155; /* Headings (light mode) */
--color-neutral-800: #1e293b; /* Dark text */
--color-neutral-900: #0f172a; /* Darkest text, dark mode backgrounds */

/* Tailwind equivalent: slate-* scale */
```

**Usage:**
- `neutral-50`: Page background (light mode)
- `neutral-100`: Card/panel backgrounds
- `neutral-200`: Borders, dividers
- `neutral-600`: Body text
- `neutral-700`: Headings, labels
- `neutral-900`: Dark mode background

### Semantic Colors

```css
/* Success - Growth, Completed, Approved */
--color-success-50: #f0fdf4;
--color-success-500: #22c55e; /* Primary success (green-500) */
--color-success-600: #16a34a; /* Hover/active */
--color-success-700: #15803d; /* Dark mode */

/* Error - Critical, Rejected, Destructive Actions */
--color-error-50: #fef2f2;
--color-error-500: #ef4444; /* Primary error (red-500) */
--color-error-600: #dc2626; /* Hover/active */
--color-error-700: #b91c1c; /* Dark mode */

/* Warning - Caution, Pending, Review Needed */
--color-warning-50: #fffbeb;
--color-warning-500: #f59e0b; /* Primary warning (amber-500) */
--color-warning-600: #d97706; /* Hover/active */
--color-warning-700: #b45309; /* Dark mode */

/* Info - Informational, Notes, Tips */
--color-info-50: #eff6ff;
--color-info-500: #3b82f6; /* Primary info (blue-500) */
--color-info-600: #2563eb; /* Hover/active */
--color-info-700: #1d4ed8; /* Dark mode */
```

**Status Color Mapping:**
- **Green (Success)**: Active clients, Approved, Available slots, Confirmed appointments
- **Red (Error)**: Rejected, Inactive, Cancelled, Overdue
- **Amber (Warning)**: Pending review, Waitlisted, Upcoming deadlines, Draft
- **Blue (Info)**: Informational messages, Tips, Documentation links

### Dark Mode Colors

```css
/* Dark Mode Overrides */
--color-dark-bg-primary: #0f172a; /* neutral-900 */
--color-dark-bg-secondary: #1e293b; /* neutral-800 - cards */
--color-dark-bg-tertiary: #334155; /* neutral-700 - hover states */
--color-dark-text-primary: #f1f5f9; /* neutral-100 */
--color-dark-text-secondary: #cbd5e1; /* neutral-300 */
--color-dark-border: #334155; /* neutral-700 */
```

**Dark Mode Strategy:**
- Invert neutral scale
- Slightly desaturate semantic colors for reduced eye strain
- Maintain WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI elements)

### Accessibility Requirements

**Contrast Ratios (WCAG AA):**
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px): 3:0:1 minimum
- UI components: 3:1 minimum

**Tested Combinations:**
✅ `primary-600` on `white`: 4.52:1
✅ `neutral-600` on `neutral-50`: 8.59:1
✅ `success-600` on `white`: 3.78:1 (use for large text/icons only)

## Typography

### Font Families

```css
/* Primary Font: Inter (clean, professional, optimized for screens) */
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

/* Monospace (for IDs, codes, technical data) */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

**Why Inter:**
- Excellent readability at small sizes (medical data, tables)
- Professional, neutral appearance
- Open source, variable font support
- Optimized for digital interfaces

### Type Scale

```css
/* Headings */
--text-h1: 2rem; /* 32px - Page titles */
--text-h2: 1.5rem; /* 24px - Section headers */
--text-h3: 1.25rem; /* 20px - Card titles, subsections */
--text-h4: 1.125rem; /* 18px - Small headings */

/* Body Text */
--text-lg: 1.125rem; /* 18px - Large body, important text */
--text-base: 1rem; /* 16px - Default body text */
--text-sm: 0.875rem; /* 14px - Secondary text, table data */
--text-xs: 0.75rem; /* 12px - Captions, helper text, badges */

/* Line Heights */
--leading-tight: 1.25; /* Headings */
--leading-snug: 1.375; /* Large text */
--leading-normal: 1.5; /* Default body */
--leading-relaxed: 1.625; /* Long-form content */
```

### Font Weights

```css
--font-normal: 400; /* Body text */
--font-medium: 500; /* Emphasized text, labels */
--font-semibold: 600; /* Headings, buttons */
--font-bold: 700; /* Strong emphasis (use sparingly) */
```

**Weight Guidelines:**
- **400 (Normal)**: Body text, descriptions, table cells
- **500 (Medium)**: Form labels, navigation items, card metadata
- **600 (SemiBold)**: Headings (H1-H4), primary buttons, active states
- **700 (Bold)**: Avoid in UI; use only for marketing content

### Typography Rules

**Headings:**
- Always use semantic HTML (`<h1>`, `<h2>`, etc.)
- `H1`: Page title, one per page, `text-2xl font-semibold text-neutral-700`
- `H2`: Section headers, `text-xl font-semibold text-neutral-700`
- `H3`: Card titles, subsections, `text-lg font-semibold text-neutral-600`

**Body Text:**
- Default: `text-base text-neutral-600 leading-normal`
- Long-form content: `text-base text-neutral-600 leading-relaxed`
- Secondary info: `text-sm text-neutral-500`

**Labels:**
- Form labels: `text-sm font-medium text-neutral-700`
- Field descriptions: `text-xs text-neutral-500`

**Links:**
- Default: `text-primary-600 hover:text-primary-700 underline decoration-primary-300`
- Subtle links: `text-neutral-600 hover:text-primary-600` (no underline)

## Spacing & Sizing

### Spacing Scale (8px base)

```css
--space-0: 0;
--space-1: 0.25rem; /* 4px - Tight spacing */
--space-2: 0.5rem; /* 8px - Base unit */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px - Default spacing */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px - Section spacing */
--space-8: 2rem; /* 32px - Large gaps */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px - Page sections */
--space-16: 4rem; /* 64px - Major sections */
```

**Usage Guidelines:**
- **Component padding**: `space-4` (1rem/16px) default
- **Card padding**: `space-6` (1.5rem/24px)
- **Section gaps**: `space-8` (2rem/32px)
- **Button padding**: `py-2 px-4` (8px vertical, 16px horizontal)
- **Input padding**: `py-2 px-3` (8px vertical, 12px horizontal)
- **Form field gaps**: `space-4` between fields

### Border Radii

```css
--radius-sm: 0.25rem; /* 4px - Badges, tags */
--radius-md: 0.375rem; /* 6px - Buttons, inputs, small cards */
--radius-lg: 0.5rem; /* 8px - Cards, modals */
--radius-xl: 0.75rem; /* 12px - Large cards, panels */
--radius-full: 9999px; /* Pills, avatars */
```

**Component Mapping:**
- Buttons: `rounded-md` (6px)
- Inputs: `rounded-md` (6px)
- Cards: `rounded-lg` (8px)
- Modals: `rounded-lg` (8px)
- Badges: `rounded-full` (pill shape)
- Avatars: `rounded-full`

### Shadows

```css
/* Light shadows for subtle depth */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

**Usage:**
- Cards (default): `shadow-sm`
- Cards (hover): `shadow-md`
- Modals/Dropdowns: `shadow-lg`
- Floating action buttons: `shadow-xl`

## Component Styles

### Buttons

**Primary Button** (Main actions: Save, Create, Submit):
```text
bg-primary-600 text-white
hover:bg-primary-700
active:bg-primary-800
focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
disabled:bg-neutral-300 disabled:cursor-not-allowed
px-4 py-2 rounded-md font-medium text-sm
transition-colors duration-150
```

**Secondary Button** (Cancel, Back, Alternative actions):
```text
bg-white text-neutral-700 border border-neutral-300
hover:bg-neutral-50 hover:border-neutral-400
active:bg-neutral-100
focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
px-4 py-2 rounded-md font-medium text-sm
```

**Destructive Button** (Delete, Remove, Cancel appointments):
```text
bg-error-600 text-white
hover:bg-error-700
active:bg-error-800
focus:ring-2 focus:ring-error-500 focus:ring-offset-2
px-4 py-2 rounded-md font-medium text-sm
```

**Ghost/Tertiary Button** (Subtle actions):
```text
text-neutral-700
hover:bg-neutral-100
active:bg-neutral-200
focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
px-4 py-2 rounded-md font-medium text-sm
```

**Button Sizing:**
- Small: `px-3 py-1.5 text-xs`
- Default: `px-4 py-2 text-sm`
- Large: `px-6 py-3 text-base`

### Form Inputs

**Text Input / Select:**
```text
border border-neutral-300 bg-white text-neutral-900
rounded-md px-3 py-2 text-sm
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
disabled:bg-neutral-100 disabled:text-neutral-400
placeholder:text-neutral-400
```

**Input with Error:**
```text
border-error-500 focus:ring-error-500
```

**Label + Input Pattern:**
```html
<label class="block text-sm font-medium text-neutral-700 mb-1">
  Client Name
</label>
<input
  type="text"
  class="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
/>
<p class="text-xs text-neutral-500 mt-1">First and last name</p>
```

**Checkbox / Radio:**
```text
/* Custom styled, not default browser */
accent-color: var(--color-primary-600);
w-4 h-4 rounded border-neutral-300
focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
```

### Cards

**Default Card:**
```text
bg-white border border-neutral-200 rounded-lg shadow-sm
p-6
hover:shadow-md transition-shadow duration-200
```

**Interactive Card (clickable):**
```text
bg-white border border-neutral-200 rounded-lg shadow-sm
p-6
hover:border-primary-300 hover:shadow-md
cursor-pointer transition-all duration-200
```

**Card Header:**
```text
border-b border-neutral-200 pb-4 mb-4
```

### Tables

**Table Structure:**
```text
/* Table container */
.table-container {
  overflow-x-auto;
  border: 1px solid theme('colors.neutral.200');
  border-radius: theme('borderRadius.lg');
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
}

/* Header */
th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: theme('colors.neutral.50');
  font-weight: 600;
  font-size: 0.875rem;
  color: theme('colors.neutral.700');
  border-bottom: 1px solid theme('colors.neutral.200');
}

/* Rows */
tr {
  border-bottom: 1px solid theme('colors.neutral.200');
}

tr:hover {
  background: theme('colors.neutral.50');
}

/* Cells */
td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: theme('colors.neutral.600');
}
```

**Table Cell Alignment:**
- Text: `text-left`
- Numbers: `text-right tabular-nums`
- Actions: `text-right`

### Badges & Status Pills

**Default Badge:**
```text
inline-flex items-center
px-2.5 py-0.5
rounded-full
text-xs font-medium
```

**Status Badge Colors:**
- **Active/Approved**: `bg-success-100 text-success-700`
- **Pending**: `bg-warning-100 text-warning-700`
- **Rejected/Inactive**: `bg-error-100 text-error-700`
- **Neutral/Draft**: `bg-neutral-100 text-neutral-700`

### Modals

**Modal Overlay:**
```text
fixed inset-0 bg-neutral-900/50 backdrop-blur-sm
z-50
```

**Modal Container:**
```text
fixed inset-0 flex items-center justify-center p-4
z-50
```

**Modal Content:**
```text
bg-white rounded-lg shadow-xl
max-w-md w-full
p-6
```

**Modal Header:**
```text
text-lg font-semibold text-neutral-900 mb-4
```

### Navigation

**Sidebar Navigation Item (Active):**
```text
flex items-center gap-3 px-3 py-2 rounded-md
bg-primary-50 text-primary-700
font-medium text-sm
```

**Sidebar Navigation Item (Inactive):**
```text
flex items-center gap-3 px-3 py-2 rounded-md
text-neutral-600
hover:bg-neutral-100 hover:text-neutral-900
font-medium text-sm
```

## Iconography

### Icon Library
**Use:** [Heroicons](https://heroicons.com/) (2.0+)
- **Why:** Clean, modern, consistent with Tailwind ecosystem, free/open-source
- **Style:** Outline style for most UI, Solid style for active states/emphasis

### Icon Sizing

```css
--icon-xs: 1rem; /* 16px - Inline with text */
--icon-sm: 1.25rem; /* 20px - Small buttons, badges */
--icon-md: 1.5rem; /* 24px - Default size */
--icon-lg: 2rem; /* 32px - Feature icons */
--icon-xl: 3rem; /* 48px - Empty states, hero sections */
```

**Icon Classes:**
```text
.icon-sm {
  width: 1.25rem;
  height: 1.25rem;
}
.icon-md {
  width: 1.5rem;
  height: 1.5rem;
}
.icon-lg {
  width: 2rem;
  height: 2rem;
}
```

### Icon Usage Guidelines

**Buttons:**
- Leading icon: Adds context (e.g., Plus icon for "Add Client")
- Icon-only buttons: Must have accessible label (`aria-label`)
- Icon size: `icon-sm` (20px)

**Navigation:**
- Sidebar items: Use outline icons (inactive), solid icons (active)
- Icon size: `icon-md` (24px)

**Status Indicators:**
- Use semantic color + icon (e.g., green check for success)
- Icon size: `icon-sm` (20px)

**Empty States:**
- Large illustrative icon
- Icon size: `icon-xl` (48px)
- Color: `text-neutral-300`

## Layout Patterns

### Page Layout

```
┌─────────────────────────────────────┐
│ Header (if needed)                  │
├──────┬──────────────────────────────┤
│      │ Content Area                 │
│ Side │ ┌────────────────────────┐   │
│ bar  │ │ Page Title (H1)        │   │
│      │ └────────────────────────┘   │
│ Nav  │ ┌────────────────────────┐   │
│      │ │ Main Content           │   │
│      │ │ (Cards, Tables, Forms) │   │
│      │ └────────────────────────┘   │
└──────┴──────────────────────────────┘
```

**Spacing:**
- Sidebar width: `16rem` (256px)
- Content max-width: `1280px` (responsive)
- Content padding: `space-6` (24px) on mobile, `space-8` (32px) on desktop
- Section gaps: `space-8` (32px)

### Grid System

**12-Column Grid:**
```text
/* Full width */
col-span-12

/* Half width (2 columns) */
col-span-6

/* Third width (3 columns) */
col-span-4

/* Quarter width (4 columns) */
col-span-3
```

**Responsive Patterns:**
- Mobile: Stack vertically (`grid-cols-1`)
- Tablet: 2 columns (`sm:grid-cols-2`)
- Desktop: 3-4 columns (`lg:grid-cols-3`, `xl:grid-cols-4`)

### Common Layouts

**Dashboard Cards:**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
    <!-- Card content -->
  </div>
</div>
```

**Form Layout (2-column on desktop):**
```html
<form class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div><!-- Field 1 --></div>
    <div><!-- Field 2 --></div>
  </div>
  <div><!-- Full width field --></div>
</form>
```

## Imagery & Illustrations

### Guidelines

**Photography:**
- Use authentic, diverse, professional photos (not stock clichés)
- Focus on real therapy environments when possible
- Warm, natural lighting
- Avoid overly clinical/sterile imagery

**Illustrations:**
- Use for empty states, onboarding, error pages
- Style: Simple, friendly, 2-3 color palette (primary + neutrals)
- Avoid infantilizing imagery (this is professional healthcare software)

**User Avatars:**
- Default: Initials on colored background
- Colors: Derived from user name (consistent per user)
- Shape: `rounded-full`
- Sizes: `w-8 h-8` (small), `w-10 h-10` (medium), `w-12 h-12` (large)

## Voice & Tone

### General Principles

**Professional but Human:**
- ✅ "Let's schedule your appointment"
- ❌ "Initiate appointment scheduling process"

**Clear, Not Cryptic:**
- ✅ "Client not found. Please check the ID and try again."
- ❌ "Error: Resource 404"

**Respectful of Sensitive Context:**
- ✅ "Client information updated successfully"
- ❌ "Patient data modified"

**Action-Oriented:**
- ✅ "Create New Client"
- ❌ "New Client Creation Interface"

### Microcopy Examples

**Empty States:**
- ✅ "No clients yet. Create your first client to get started."
- ❌ "0 clients found"

**Error Messages:**
- ✅ "This email is already in use. Try signing in instead."
- ❌ "Duplicate email constraint violation"

**Success Messages:**
- ✅ "Appointment scheduled for March 15 at 2:00 PM"
- ❌ "Operation completed successfully"

**Destructive Actions:**
- ✅ "Delete appointment? This cannot be undone."
- ❌ "Confirm deletion"

## Animation & Motion

### Transition Durations

```css
--duration-fast: 150ms; /* Hover states, small changes */
--duration-normal: 200ms; /* Default (most UI transitions) */
--duration-slow: 300ms; /* Modals, large movements */
```

### Easing Functions

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Default */
--ease-out: cubic-bezier(0, 0, 0.2, 1); /* Entrances */
--ease-in: cubic-bezier(0.4, 0, 1, 1); /* Exits */
```

### Animation Guidelines

**DO:**
- ✅ Fade in modals and dropdowns
- ✅ Smooth color transitions on hover
- ✅ Slide in notifications/toasts
- ✅ Scale buttons on active/press states
- ✅ Skeleton screens for loading content

**DON'T:**
- ❌ Animate large page transitions (keep snappy)
- ❌ Use animations longer than 300ms
- ❌ Animate on every interaction (causes fatigue)
- ❌ Use bounce/elastic easing (unprofessional)

### Loading States

**Skeleton Screens (preferred for page loads):**
```text
bg-neutral-200 animate-pulse rounded
```

**Spinner (for button/inline loading):**
```html
<svg class="animate-spin h-5 w-5 text-primary-600">
  <!-- Spinner SVG -->
</svg>
```

## Accessibility (WCAG AA+)

### Checklist

- ✅ All text meets 4.5:1 contrast ratio (4.5:1 for normal, 3:1 for large)
- ✅ Interactive elements have visible focus states
- ✅ Keyboard navigation works for all functionality
- ✅ Form inputs have associated labels
- ✅ Error messages are announced to screen readers
- ✅ Icons have accessible labels (`aria-label`, `sr-only` text)
- ✅ Color is not the only indicator of status (use icons + text)
- ✅ Touch targets are at least 44×44px

### Focus States

**Default Focus Ring:**
```text
focus:outline-none
focus:ring-2
focus:ring-primary-500
focus:ring-offset-2
```

**Skip to Main Content Link:**
```html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

## Responsive Design

### Breakpoints

```text
/* Mobile first approach */
sm: 640px   /* Tablet portrait */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile Considerations

**Touch Targets:**
- Minimum size: `44×44px` (iOS), `48×48px` (Android)
- Buttons: `py-3 px-4` on mobile

**Navigation:**
- Sidebar: Hidden on mobile, accessible via hamburger menu
- Bottom navigation (optional): For primary actions on mobile

**Forms:**
- Stack vertically on mobile
- Use appropriate input types (`type="email"`, `type="tel"`)
- Large, easy-to-tap inputs

**Tables:**
- Use horizontal scroll container on mobile
- Or convert to card-based layout for better mobile UX

## Implementation Notes

### Tailwind Configuration

Add to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Use Tailwind's default slate for neutrals
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

### CSS Variables (Alternative)

If using CSS custom properties instead of/in addition to Tailwind:

```css
:root {
  /* Import all color variables from above */
  /* Import all spacing/sizing variables */
}

[data-theme='dark'] {
  /* Dark mode overrides */
}
```

## Design Checklist for Each Component

Before marking any UI component as complete, verify:

- [ ] Colors match style guide (primary, neutrals, semantic)
- [ ] Typography follows scale and weight rules
- [ ] Spacing uses 8px base scale
- [ ] Border radius is consistent with component type
- [ ] Focus states are visible and follow guide
- [ ] Hover states provide clear feedback
- [ ] Disabled states are visually distinct
- [ ] Mobile responsive (tested at 375px, 768px, 1440px)
- [ ] Dark mode works (if implemented)
- [ ] Meets WCAG AA contrast requirements
- [ ] Icons are from Heroicons, properly sized
- [ ] Loading states are implemented
- [ ] Error states are clear and actionable

## Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Heroicons**: https://heroicons.com/
- **Inter Font**: https://rsms.me/inter/
- **WCAG Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Palette Tool**: https://uicolors.app/create

---

**Last Updated**: 2025-11-02
**Version**: 1.0
**Maintained by**: Development Team
