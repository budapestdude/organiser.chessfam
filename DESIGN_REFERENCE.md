# ChessFam Design System Reference

This document contains the design system from the main ChessFam platform for consistency.

## Color Palette

### Primary Colors (Purple)
- `primary-50`: #f5f3ff
- `primary-100`: #ede9fe
- `primary-200`: #ddd6fe
- `primary-300`: #c4b5fd
- `primary-400`: #a78bfa
- `primary-500`: #8b5cf6 (main)
- `primary-600`: #7c3aed
- `primary-700`: #6d28d9
- `primary-800`: #5b21b6
- `primary-900`: #4c1d95

### Gold/Accent Colors
- `gold-50`: #fffbeb
- `gold-100`: #fef3c7
- `gold-200`: #fde68a
- `gold-300`: #fcd34d
- `gold-400`: #fbbf24
- `gold-500`: #f59e0b (main)
- `gold-600`: #d97706
- `gold-700`: #b45309
- `gold-800`: #92400e
- `gold-900`: #78350f

### Chess Brand Colors
- `chess-dark`: #1a1a2e (dark background)
- `chess-darker`: #0f0f1a (darker background)
- `chess-light`: #f8f8fc (light text/elements)
- `chess-accent`: #c9a227 (accent gold)

## Typography

### Font Families
- **Sans-serif (body)**: 'Inter', system-ui, sans-serif
- **Display (headings)**: 'Playfair Display', Georgia, serif
- **Emoji**: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'

## Component Styles

### Glass Card Effect
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
```

### Gradient Text
```css
background: linear-gradient(to right, #fbbf24, #fcd34d, #f59e0b);
-webkit-background-clip: text;
color: transparent;
```

### Primary Button
```css
padding: 16px 32px;
background: linear-gradient(to right, #f59e0b, #d97706);
color: #0f0f1a;
font-weight: 600;
border-radius: 12px;
box-shadow: 0 10px 25px rgba(245, 158, 11, 0.25);
```
- Hover: Scale to 105%, lighter gradient

### Secondary Button
```css
padding: 16px 32px;
border: 2px solid rgba(255, 255, 255, 0.2);
color: white;
font-weight: 600;
border-radius: 12px;
```
- Hover: background rgba(255, 255, 255, 0.1), border rgba(255, 255, 255, 0.4)

## Design Principles

1. **Dark Theme**: Default dark background (#0f0f1a) with light text
2. **Glass Morphism**: Use translucent backgrounds with blur effects
3. **Gold Accents**: Use gold colors for calls-to-action and highlights
4. **Purple for Interactive**: Primary purple for interactive elements
5. **Smooth Animations**: All transitions 300ms with smooth easing
6. **Rounded Corners**: Generous border-radius (12px-16px typical)
7. **Subtle Shadows**: Use colored shadows (gold-500/25) for depth
8. **White Opacity**: Use white/5, white/10, white/20 for backgrounds

## Common Patterns

### Card Layout
- Background: white/5
- Border: white/10
- Padding: 24px (p-6)
- Border radius: 16px (rounded-2xl)

### Input Fields
- Background: white/5
- Border: white/10
- Focus border: gold-500 or primary-500
- Padding: 12px 16px

### Status Badges
- Background: Colored/20 (e.g., green-500/20)
- Text: Colored-400 (e.g., green-400)
- Padding: 4px 12px
- Border radius: 8px
- Font size: 12px, font-weight: 600

### Hover States
- Scale transform: 105%
- Brightness increase or opacity change
- Smooth transition (300ms)
