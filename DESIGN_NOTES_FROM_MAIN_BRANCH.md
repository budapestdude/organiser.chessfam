# Design Notes from Main ChessFam Branch

This document contains design reference notes extracted from the main ChessFam platform branch before removal. Use these as reference for maintaining consistent design across the Organizer Hub.

## Design System Overview

The main ChessFam platform uses a dark chess-themed design with the following characteristics:

### Color Palette
- **Primary Background**: Dark chess-themed (#0a0a0a - #1a1a1a range)
- **Primary Accent**: Gold/Yellow (#F0B90B, #FFD700) - signature chess theme
- **Secondary Accent**: Blue/Primary (#6366f1, #4f46e5) - for interactive elements
- **Text Colors**:
  - Primary text: White (#ffffff)
  - Secondary text: White with opacity (white/70, white/60, white/50)
  - Muted text: White with low opacity (white/30, white/40)

### Typography
- **Font Family**: System fonts with fallbacks
  - Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
  - Display/Headings: May use custom chess-themed fonts
- **Font Sizes**:
  - Hero: 3xl - 4xl (48px - 60px)
  - Headings: xl - 2xl (20px - 30px)
  - Body: base - lg (16px - 18px)
  - Small: sm - xs (12px - 14px)

### Component Patterns

#### Cards
- Background: `bg-white/5` with `border border-white/10`
- Hover states: `hover:bg-white/10` or `hover:border-white/20`
- Rounded corners: `rounded-xl` (12px) or `rounded-2xl` (16px)
- Shadow: Minimal, mostly border-based depth

#### Buttons
- **Primary**: Gold background (`bg-gold-500`) with dark text
- **Secondary**: White/10 background with white text
- **Ghost**: Transparent with border
- Padding: `px-4 py-2` or `px-6 py-3`
- Border radius: `rounded-lg` or `rounded-xl`
- Transitions: `transition-colors` or `transition-all`

#### Forms & Inputs
- Background: `bg-white/5`
- Border: `border border-white/10`
- Focus state: `focus:border-primary-500`
- Placeholder: `placeholder-white/30`
- Padding: `p-3`

#### Badges/Tags
- Background: Transparent or color-specific with opacity
- Border: Matching color with opacity
- Examples:
  - Classical: `bg-blue-500/20 text-blue-400 border-blue-500/30`
  - Blitz: `bg-orange-500/20 text-orange-400 border-orange-500/30`
  - Rapid: `bg-green-500/20 text-green-400 border-green-500/30`

### Layout Patterns

#### Page Container
```tsx
<div className="min-h-screen py-8 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
```

#### Grid Layouts
- Tournament/Card grids: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`
- Responsive breakpoints: Mobile-first approach

#### Spacing
- Section spacing: `space-y-6` or `space-y-8`
- Card padding: `p-4` or `p-6`
- Gap between elements: `gap-2` to `gap-6`

### Animation & Motion

Uses Framer Motion for smooth animations:
- **Initial states**: `opacity: 0, y: 20`
- **Animate to**: `opacity: 1, y: 0`
- **Transitions**: `delay: index * 0.05` for stagger effects
- **Hover**: Scale, color changes
- **Page transitions**: Fade in with slide up

### Icons
- Library: Lucide React
- Size: `w-4 h-4` to `w-6 h-6` typically
- Color: Match text color or use specific accent colors

## Tournament-Specific Design

### Tournament Cards
- Image: Aspect ratio square (`aspect-square`)
- Status badges: Positioned absolute top-left
- Prize display: Gold trophy icon with amount
- Entry fee: Displayed at bottom with separator border
- Player count: Small text with Users icon

### Status Indicators
- **Upcoming**: Green badge (`bg-green-500/80`)
- **Ongoing**: Blue badge (`bg-blue-500/80`)
- **Completed**: Gray badge (`bg-gray-500/80`)
- **Featured**: Gold badge (`bg-gold-500`)

## Navigation

### Header/Navigation Bar
- Sticky or fixed positioning
- Background with backdrop blur: `bg-chess-darker/80 backdrop-blur-sm`
- Border bottom: `border-b border-white/10`
- Links with hover states

### Mobile Navigation
- Hamburger menu for mobile
- Slide-in drawer with backdrop
- Close on route change

## Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Common Responsive Patterns
- Hide on mobile, show on desktop: `hidden md:flex`
- Stack on mobile, grid on desktop: `flex flex-col md:grid md:grid-cols-2`
- Text size scaling: `text-sm md:text-base lg:text-lg`

## Accessibility

- Focus states: Always visible with `focus:outline-none focus:ring-2`
- Keyboard navigation: All interactive elements accessible
- Color contrast: Meets WCAG AA standards
- Alt text: All images have descriptive alt text

## Performance

- Image optimization: WebP format, lazy loading
- Code splitting: Route-based
- Animations: GPU-accelerated (transform, opacity)

## Key Components to Reference

1. **Tournament List**: Grid layout with cards
2. **Tournament Detail**: Hero image, tabs, registration
3. **Modal/Dialog**: Backdrop blur, centered, escape to close
4. **Form Inputs**: Consistent styling, validation states
5. **Loading States**: Spinner with animation
6. **Empty States**: Icon, message, CTA

## Notes

- Maintain consistent spacing and rhythm
- Use opacity for hierarchy rather than different colors
- Keep animations subtle and purposeful
- Mobile-first approach for all layouts
- Dark theme throughout - no light mode toggle needed

---

**Last Updated**: January 30, 2026
**Source**: Main ChessFam Platform Branch (removed)
