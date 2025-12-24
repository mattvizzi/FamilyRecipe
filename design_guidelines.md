# Recipe Tracker Design Guidelines

## Design Approach
**Selected System:** Material Design 3 principles adapted for modern web applications, emphasizing clean hierarchy, purposeful whitespace, and smooth micro-interactions.

**Design Philosophy:** Minimalist interface that puts recipes front and center, with intelligent use of space and professional animations that enhance rather than distract from the core functionality.

---

## Typography System

**Font Stack:**
- Primary: Inter (Google Fonts) - clean, modern, excellent readability
- Monospace: JetBrains Mono - for recipe IDs and technical elements

**Hierarchy:**
- Page Titles: 2xl (1.5rem), semibold
- Section Headers: xl (1.25rem), semibold  
- Recipe Names: lg (1.125rem), medium
- Body Text: base (1rem), regular
- Metadata/Labels: sm (0.875rem), medium
- Captions: xs (0.75rem), regular

**Line Heights:**
- Headings: tight (1.25)
- Body: relaxed (1.625)
- Compact UI: normal (1.5)

---

## Layout & Spacing System

**Spacing Scale:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (within components): 2, 4
- Component padding: 6, 8
- Section spacing: 12, 16, 20
- Page margins: 16, 20, 24

**Container Widths:**
- Main content: max-w-7xl (1280px)
- Recipe detail: max-w-4xl (896px)
- Chat wizard: max-w-2xl (672px)
- Form elements: max-w-md (448px)

**Grid System:**
- Recipe cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Gap between cards: gap-6
- List view: Single column with gap-4

---

## Component Library

### Navigation Header
- Fixed position with backdrop blur
- Height: h-16
- Inner padding: px-6, py-4
- Contains: Family name (left), primary actions (center), user menu (right)
- Add Recipe button: Prominent placement, icon + text on desktop, icon-only on mobile

### Recipe Cards (Grid View)
- Aspect ratio: 4:3 for image area
- Card structure:
  - AI-generated recipe image (full-width, rounded-t-lg)
  - Content area: p-4
  - Recipe name: truncate after 2 lines
  - Metadata row: flex layout with category badge and prep time
  - Category badge: Inline badge with rounded-full, px-3, py-1
- Hover state: Subtle lift with shadow-lg transition
- Border: border with subtle rounding (rounded-lg)

### Recipe Cards (List View)
- Horizontal layout: Image thumbnail (left, w-24, h-24, rounded-lg), content (flex-1)
- Padding: p-4
- Metadata: Inline display of all key info with separators

### AI Chat Wizard
- Full-screen overlay with centered card (max-w-2xl)
- Card padding: p-8
- Progressive disclosure: Steps reveal smoothly with slide-in animations
- Upload area: Dashed border, rounded-xl, p-12, hover state with border transition
- Processing state: Animated gradient shimmer effect on placeholder
- Message bubbles: User (right-aligned), AI (left-aligned), rounded-2xl, p-4

### Recipe Detail Page
- Hero section: Full-width AI-generated image, h-64, with gradient overlay at bottom
- Content container: max-w-4xl, mx-auto, px-6
- Recipe header: -mt-12 (overlapping hero), rounded-xl card with shadow-xl
  - Recipe name, category badge, attribution, prep/cook time, servings
- Recipe ID: Monospace font, text-xs, subtle styling in top-right
- Ingredient section: Two-column layout on desktop (md:grid-cols-2), gap-4
- Instructions: Numbered steps with generous spacing (space-y-6)
- Recipe groups: Collapsible sections with smooth expand/collapse, border-l-4 accent

### Scaling Controls
- Horizontal button group with current scale highlighted
- Buttons: 1x, 1.5x, 2x, 2.5x, 3x, 3.5x, 4x
- Compact sizing: px-3, py-1.5, text-sm
- Sticky positioning below recipe header on scroll

### In-line Editing
- Fields become editable on click with subtle border highlight
- Edit icon appears on hover
- Auto-save indicator: Small checkmark animation
- Transition: 200ms ease for all state changes

### Empty State
- Centered content: max-w-md
- Large icon (h-32, w-32)
- Heading + descriptive text + primary CTA
- 3-step guide cards in grid layout (md:grid-cols-3)

### Form Elements
- Input fields: rounded-lg, px-4, py-3, border with focus ring
- Textareas: min-h-32 for instructions, auto-expanding
- Select dropdowns: Custom styled with icons
- Fraction inputs: Special handling with helper text

### Buttons
- Primary: px-6, py-3, rounded-lg, font-medium, shadow-sm
- Secondary: Ghost style with hover background
- Icon buttons: p-2, rounded-full
- All buttons: Smooth transitions (150ms)

### PDF Export Preview Modal
- Overlay with centered preview card (max-w-4xl)
- Preview area: White background, shadow-2xl, p-12
- Action bar: Fixed bottom, flex layout, gap-4

---

## Images

### AI-Generated Recipe Photos
**Placement:** Every recipe card and detail page hero
**Specifications:**
- Aspect ratio: 4:3 for cards, 16:9 for detail hero
- Dimensions: Generate at 1024x768 minimum
- Style: Professional food photography, clean plating, natural lighting, shallow depth of field
- Prompt engineering: Include cuisine type, dish name, "professional food photography, styled on clean white plate, natural window lighting, shallow depth of field, appetizing, editorial quality"

### Empty States & Placeholders
**Upload Wizard:** Large icon illustration (chef's hat or recipe book)
**No Recipes:** Friendly illustration encouraging first recipe addition

### Image Treatment
- Border radius: rounded-lg for cards, rounded-xl for detail heroes
- Loading state: Shimmer effect placeholder with same dimensions
- Error fallback: Subtle icon placeholder with retry option

---

## Animations & Transitions

**Micro-interactions:**
- Card hover: transform scale-105, duration-200
- Button press: scale-95, duration-100
- Modal entry: Fade + slide from bottom, duration-300
- Wizard steps: Slide transitions, duration-500 with ease-out
- Loading states: Pulse animation for skeletons

**AI Processing Animation:**
- Multi-stage shimmer effect
- Progress indicator with smooth transitions
- Success checkmark with bounce effect

**Page Transitions:**
- Crossfade between views: duration-200
- Recipe detail: Slide up from bottom, duration-300

---

## Accessibility Standards

- Minimum touch targets: 44x44px
- Focus indicators: 2px ring with offset
- Keyboard navigation: Full support with visible focus states
- ARIA labels: All interactive elements and dynamic content
- Color contrast: Meets WCAG AA standards (evaluated separately from these guidelines)
- Screen reader: Semantic HTML with proper headings hierarchy

---

## Responsive Behavior

**Breakpoints:**
- Mobile: Base (< 640px)
- Tablet: md (768px)
- Desktop: lg (1024px)
- Wide: xl (1280px)

**Mobile Adaptations:**
- Single column layouts
- Bottom sheet for modals instead of centered cards
- Simplified navigation with hamburger menu
- Stacked form layouts
- Reduced padding (px-4 instead of px-6)

**Desktop Enhancements:**
- Multi-column recipe grids
- Side-by-side layouts for forms
- Persistent navigation
- Enhanced hover states
- Larger imagery