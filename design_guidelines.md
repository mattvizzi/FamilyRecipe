# Recipe Tracker Design Guidelines

## Design Approach
**Selected System:** OpenSea-inspired dark minimal aesthetic with flat design, emphasizing clean hierarchy, subtle borders for depth, and professional simplicity.

**Design Philosophy:** Marketplace-inspired interface that puts recipes front and center, with flat surfaces, subtle 1px borders for visual hierarchy, and a dark color scheme that feels modern and sophisticated.

---

## Color System

**Theme:** Forced dark mode (no light mode toggle)

**Background Colors:**
- Background Base: #0c0c0d (HSL 240 7% 5%)
- Card Background: #1a1a1d (HSL 240 5% 11%)
- Muted/Secondary: #1e1e21 (HSL 240 5% 12%)

**Border Colors:**
- Default Border: #2a2a2d (HSL 240 4% 17%)
- Subtle Border: rgba(255, 255, 255, 0.1)

**Accent Colors:**
- Primary (Electric Blue): #2081e2 (HSL 210 77% 51%)
- Primary Hover: Slightly lightened via opacity
- Destructive: #dc2626

**Text Colors:**
- Foreground (Primary): #f0f0f0
- Muted Foreground: #8a8a8a
- Secondary Foreground: #a0a0a0

---

## Typography System

**Font Stack:**
- Primary: Inter (system fallback: -apple-system, Segoe UI)
- Data/Numerical: "JetBrains Mono", "SF Mono", Menlo, Monaco, monospace

**Special Typography Classes:**
- `.font-data` - For numerical data display (recipe IDs, times, servings, scale factors)

**Hierarchy:**
- Page Titles: text-2xl (1.5rem), font-bold
- Section Headers: text-lg (1.125rem), font-semibold  
- Recipe Names: text-base (1rem), font-medium
- Body Text: text-sm (0.875rem), regular
- Metadata/Labels: text-xs (0.75rem), font-medium, uppercase tracking-wide
- Captions: text-xs (0.75rem), text-muted-foreground

---

## Layout & Spacing System

**Design Principle:** Tighter spacing than Material Design, more compact and information-dense.

**Spacing Scale (Tailwind Units):**
- Micro spacing (within components): 1, 1.5, 2
- Component padding: 3, 4
- Section spacing: 5, 6, 8
- Page margins: 6 (px-6), 12 (pb-12)

**Container Widths:**
- Main content: max-w-7xl (1280px)
- Recipe detail sidebar: 380px
- Form elements: max-w-md (448px)

**Border Radius:** Consistently smaller
- Cards, panels: rounded-lg (0.5rem)
- Buttons, inputs: rounded-md (0.375rem)
- Badges: rounded-sm (0.125rem)

---

## Visual Effects Policy

**REMOVE ALL PREMIUM EFFECTS:**
- No glassmorphism/backdrop-blur
- No drop shadows (shadow-sm, shadow-md, shadow-xl)
- No glow effects
- No gradient overlays except for hero wash
- No animation zoom effects on hover

**FLAT DESIGN APPROACH:**
- Depth conveyed through 1px borders (border border-border)
- Background color differentiation instead of shadows
- Flat surfaces with subtle color contrast
- Simple transitions (opacity, color changes only)

---

## Component Library

### Navigation Header
- Fixed position, bg-background/95 (no blur)
- Height: h-14 (56px)
- Inner padding: px-6
- Border bottom: border-b border-border
- Simple logo text, no decorative elements

### Recipe Cards (Grid View)
- Border: border border-border (1px solid)
- Background: bg-card
- Border radius: rounded-lg
- No shadow, no hover transform
- Image: aspect-[4/3], rounded-t-lg inside card overflow-hidden
- Content: p-3 compact padding
- Metadata: text-xs, font-data for numerical values

### Recipe Cards (List View)
- Horizontal layout with left thumbnail
- Single border, no shadow
- Compact vertical padding (py-3)

### Ingredients Card (Recipe Detail)
- border border-border
- Flat card background
- Scale controls: border rounded-lg inline container
- Ingredient list: text-sm, font-data for amounts

### Buttons
- Primary: bg-primary text-primary-foreground (electric blue)
- Secondary: bg-secondary text-secondary-foreground
- Ghost: No background, subtle hover
- Outline: border border-border
- No custom shadows, no glow effects
- Default sizes only (no custom h-11, rounded-xl)

### Badges
- variant="secondary" for categories
- text-xs size
- Minimal padding
- No border-glow or shadows

### Form Elements
- Input/Select: Default shadcn styling
- No custom rounded-xl overrides
- Focus ring as default

---

## Images

### Recipe Photos
- Border radius: rounded-lg (inside overflow-hidden container)
- No hover zoom effect
- Flat border overlay if needed

### Placeholder/Loading
- bg-muted simple flat color
- No gradient shimmer (use animate-pulse if needed)

---

## Hero Section (Landing Page)

**Dark Wash Approach:**
- Dark gradient overlay from bottom for text readability
- Light text (white) over any hero images
- Buttons: Primary (filled) or Outline with bg-white/10 backdrop

---

## Animations & Transitions

**SIMPLIFIED APPROACH:**
- 200ms transitions for color/opacity changes
- No scale transforms on hover
- No complex multi-stage animations
- Simple fade-in for stagger effects if used

**Allowed:**
- opacity transitions
- color transitions
- basic transform (rotate for chevrons only)

**Removed:**
- hover:scale-* effects
- group-hover zoom
- complex shimmer effects
- floating/bouncing animations

---

## Accessibility Standards

- Minimum touch targets: 44x44px
- Focus indicators: ring-2 ring-primary
- Keyboard navigation: Full support
- Color contrast: WCAG AA compliant

---

## Responsive Behavior

**Breakpoints:**
- Mobile: Base (< 640px)
- Tablet: md (768px)
- Desktop: lg (1024px)
- Wide: xl (1280px)

**Mobile Adaptations:**
- Single column layouts
- Reduced padding (px-4 instead of px-6)
- Stacked form layouts

**Desktop Enhancements:**
- Multi-column recipe grids (up to 4 columns)
- Side-by-side layouts
- Sidebar sticky positioning
