# Design Guidelines: Elite Strength & Conditioning Platform

## Design Approach

**Selected Framework:** Hybrid approach combining Linear's clean, data-focused aesthetics with Notion's flexible content organization and Apple HIG's clarity principles. This platform requires both utility (for coaches managing data) and inspiration (for athletes staying motivated).

**Core Principles:**
- Clarity over decoration: Information hierarchy must be immediately scannable
- Performance-first design: Fast load times, instant feedback on actions
- Motivational design: Visual progress indicators and achievement moments
- Professional credibility: Clean, athletic aesthetic that coaches trust

## Typography System

**Font Families:**
- Primary: Inter (Google Fonts) - Interface text, data displays
- Secondary: DM Sans (Google Fonts) - Headings, emphasis elements

**Type Scale:**
- Hero/Large Display: 3xl to 4xl (48-56px), font-weight-700
- Section Headers: 2xl (32px), font-weight-700
- Card Headers/Subsections: xl (24px), font-weight-600
- Body Text: base (16px), font-weight-400
- Small Data/Labels: sm (14px), font-weight-500
- Micro Text/Captions: xs (12px), font-weight-400

**Hierarchy Rules:**
- Coach dashboard: Emphasize data density with consistent sm/base sizing
- Athlete views: Larger, more encouraging typography (base/lg)
- Exercise instructions: Clear hierarchy with lg headers, base body text

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Tight spacing (2-4): Within cards, between related elements
- Medium spacing (6-8): Between card sections, form fields
- Large spacing (12-16): Between major components, page sections
- Extra large (24): Page margins, hero spacing

**Grid Structure:**
- Desktop: 12-column grid with max-w-7xl containers
- Dashboard layouts: Asymmetric 3-column (sidebar: 64px, nav: 240px, content: flex-1)
- Content areas: 2-column splits for data visualization (8/4 ratio)
- Mobile: Single column, stacked components with full-width cards

**Container Strategy:**
- Full-width app shell with nested max-width containers
- Dashboard content: No max-width (utilize screen space)
- Marketing pages: max-w-7xl centered
- Forms and focused content: max-w-2xl for readability

## Component Architecture

### Navigation
**Primary Navigation (Coach/Admin):**
- Fixed sidebar (240px width) with icon+label navigation items
- Collapsible to icon-only (64px) for more workspace
- Top bar with breadcrumbs, search, profile dropdown
- Clear active states with subtle indicators

**Athlete Navigation:**
- Simplified tab-based navigation: Today, Program, Progress, Profile
- Bottom navigation on mobile (fixed)
- Minimal chrome to maximize content area

### Dashboard Components

**Stat Cards:**
- Compact design: p-6 spacing, rounded-xl borders
- Large number display (3xl, font-weight-700) with descriptive label
- Subtle trend indicators (arrows, mini-graphs)
- Grid layout: 3-4 cards across desktop, stack on mobile

**Data Tables:**
- Minimal styling with hover states on rows
- Sticky headers for scrollable content
- Sortable columns with clear indicators
- Alternating row treatment for readability
- Actions column (right-aligned) with icon buttons

**Exercise Cards:**
- Thumbnail image (16:9 aspect ratio, rounded-lg)
- Exercise name (lg, font-weight-600)
- Metadata row: sets, reps, weight (sm, font-weight-500)
- Video play overlay with subtle backdrop blur
- Compact variant for list views, expanded for details

### Forms & Input

**Input Fields:**
- Height: h-12 for all text inputs
- Rounded: rounded-lg borders
- Clear labels above inputs (sm, font-weight-500)
- Validation states: Error text below field (text-sm)
- Number spinners for weight/reps with large touch targets

**Workout Logger:**
- Set-by-set input with tabular layout
- Quick-entry numeric keyboard overlay on mobile
- Previous performance shown as ghost text
- Auto-save with subtle confirmation feedback
- Rest timer integration (large, readable countdown)

**Program Builder (Coach):**
- Drag-and-drop exercise list with visual handles
- Inline editing for sets/reps/notes
- Template selector with preview cards
- Week view calendar for program scheduling

### Content Displays

**Exercise Library:**
- Masonry grid (3 columns desktop, 2 tablet, 1 mobile)
- Search bar with category filters (chips/tags)
- Card: Image top, title, category badge, difficulty indicator
- Modal view for exercise details with full video player

**Progress Visualizations:**
- Line charts for weight progression over time
- Bar charts for volume comparisons
- Minimal grid lines, clear axis labels
- Responsive: Full width on mobile, multi-column on desktop
- Interactive tooltips on hover/tap

**Calendar View:**
- Month grid with workout indicators (dots/badges)
- Day cells: h-24 minimum for content
- Modal for day detail showing full workout
- Color-coded by workout type (strength, cardio, rest)

### Modal & Overlay Patterns

**Standard Modals:**
- Centered on screen with backdrop blur
- Max-width: max-w-2xl for forms, max-w-4xl for video
- Rounded: rounded-2xl
- Padding: p-8
- Close button: top-right with clear icon

**Slide-out Panels:**
- Right-side panel for quick actions (w-96)
- Full-height with subtle shadow
- Use for: notifications, quick edits, athlete selection

### Buttons & Actions

**Button Hierarchy:**
- Primary CTA: Large (h-12), full-width on mobile, w-auto on desktop
- Secondary: Outlined variant, same sizing
- Tertiary: Text-only with icon, minimal padding
- Icon-only: Square (h-10 w-10), rounded-lg for tools/actions

**Floating Actions:**
- Bottom-right on desktop (fixed position)
- Primary action button (rounded-full, large size)
- Expandable menu for multiple actions

## Page-Specific Guidelines

### Landing Page (Marketing)
**Structure:** 8 sections with strategic whitespace
1. **Hero:** Full-viewport (min-h-screen), split layout - left: headline (4xl) + subhead + dual CTAs, right: product screenshot or athlete in action image
2. **Logo Bar:** Customer logos in grid (6 logos, grayscale with hover effects)
3. **Features Grid:** 3-column layout with icon, title, description cards
4. **Platform Demo:** Large screenshot with annotation callouts
5. **Testimonials:** 3-column cards with athlete photos, quotes, credentials
6. **Stats Section:** 4-stat horizontal display with large numbers
7. **Pricing Tiers:** 3-column comparison with feature lists
8. **Footer CTA:** Full-width with strong headline and trial signup

**Multi-Column Strategy:** Features (3-col), Testimonials (3-col), Pricing (3-col) on desktop. Stack to single column on mobile.

### Coach Dashboard
**Layout:** Three-column asymmetric
- Left sidebar: Navigation (240px)
- Main content: Stat overview (3-card row) + Recent activity table + Athlete list
- Right panel: Quick actions + Upcoming sessions

### Athlete Workout View
**Layout:** Single column, focused
- Current workout card (prominent, elevated)
- Exercise list with expandable details
- Persistent bottom bar: Timer + Complete button

### Exercise Library
**Layout:** Grid-based with filters
- Left sidebar (240px): Category filters, search
- Main grid: 3-column masonry on desktop
- Modal overlay: Exercise detail with full-screen video option

## Images

**Hero Section:**
- Large background image: Athletic/gym environment with authentic coaching moment
- Style: Slightly desaturated with subtle overlay for text readability
- Positioning: Cover, centered on subjects
- Aspect ratio: 16:9 minimum, extends to full viewport height

**Exercise Database:**
- Thumbnail images: 16:9 ratio, high-quality exercise demonstrations
- Consistent framing: Subject centered, clear form visibility
- Background: Neutral gym environment or isolated subject

**Testimonial Sections:**
- Square headshots (1:1) of coaches/athletes
- Professional quality, authentic expressions
- Uniform sizing across all testimonials

**Dashboard:**
- Avatar images: Circular (rounded-full), 40x40px for lists, 80x80px for profiles
- Placeholder: Initials with subtle background when no image

## Accessibility

- All interactive elements minimum 44x44px touch targets
- Form inputs with clear focus states (ring treatment)
- ARIA labels on icon-only buttons
- Keyboard navigation support throughout
- Clear error states with descriptive text
- High contrast maintained throughout interface