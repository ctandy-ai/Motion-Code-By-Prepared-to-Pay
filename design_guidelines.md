# Elite Strength Platform - Gamified Design System

## Design Philosophy
Transform strength training into an engaging, game-like experience with vibrant energy, competitive elements, and athlete-agnostic appeal. Think: fitness meets gaming aesthetics with bold colors, achievement systems, and motivating visual feedback.

## Color Palette

### Primary Colors (Energy & Achievement)
- **Electric Purple**: `hsl(270, 91%, 65%)` - Primary actions, XP bars, level-ups
- **Neon Cyan**: `hsl(180, 100%, 50%)` - Achievements, streaks, highlights
- **Vibrant Orange**: `hsl(25, 95%, 58%)` - Challenges, warnings, heat
- **Success Green**: `hsl(142, 71%, 45%)` - Completed workouts, PRs

### Neutral Base (Dark Mode First)
- **Deep Space**: `hsl(240, 15%, 8%)` - Main background
- **Charcoal**: `hsl(240, 12%, 12%)` - Card backgrounds
- **Slate**: `hsl(240, 10%, 18%)` - Elevated surfaces
- **Steel**: `hsl(240, 8%, 85%)` - Primary text
- **Muted**: `hsl(240, 5%, 55%)` - Secondary text

### Accent Colors (Gamification)
- **Gold**: `hsl(45, 100%, 51%)` - Legendary achievements, top ranks
- **Silver**: `hsl(0, 0%, 75%)` - Rare achievements
- **Bronze**: `hsl(25, 75%, 47%)` - Common achievements

## Typography
- **Display Font**: 'Rajdhani' (Bold, futuristic, gaming-inspired)
- **Body Font**: 'Inter' (Clean, readable)
- **Accent Font**: 'Orbitron' (Tech/gaming aesthetic for stats/numbers)

## Gamification Elements

### Experience System
- XP earned for: completing workouts, achieving PRs, consistency streaks
- Level progression with visual tier badges
- Progress bars with glow effects when near level-up

### Achievement System
- Unlockable badges (Bronze/Silver/Gold/Legendary)
- Achievement categories: Strength, Endurance, Consistency, Social
- Pop-up celebrations when earned

### Streak System
- Daily workout streaks with fire emojis/visual flames
- Weekly challenge completion tracking
- Streak freeze power-ups

### Leaderboards
- Weekly/Monthly/All-Time rankings
- Team-based competitions
- Personal bests showcase

### Challenge System
- Daily challenges (bonus XP)
- Weekly team challenges
- Custom coach-created challenges

## Component Styles

### Cards
- Darker backgrounds with subtle gradient overlays
- Neon accent borders on hover
- Slight glow effects for active/important cards
- Rounded corners: `12px`

### Buttons
- Primary: Electric purple gradient with glow
- Success: Green with pulse animation on hover
- Challenge: Orange with subtle shake animation
- Ghost: Transparent with neon border

### Progress Bars
- Gradient fills (purple → cyan)
- Animated glow when increasing
- Segmented for level tiers
- Particle effects on completion

### Badges & Achievements
- Metallic gradients (gold/silver/bronze)
- Shine/glint animations
- Pop-in animations when earned
- Rarity indicators (common/rare/epic/legendary)

### Stats Display
- Large numbers with Orbitron font
- Animated counting up
- Color-coded by performance (green/orange/red)
- Glow effects for records

## Animations & Effects

### Micro-interactions
- Button press: Scale down + glow
- Card hover: Lift + border glow
- Achievement unlock: Burst particles
- Level up: Screen flash + confetti
- PR achieved: Golden glow pulse

### Transitions
- Smooth page transitions with fade
- Stagger animations for lists
- Parallax effects on scroll
- Loading states with pulse animations

## Layout Patterns

### Dashboard
- XP bar prominent at top
- Achievement showcase
- Recent activity feed with game-like notifications
- Streak counter with visual flame/ice effects
- Quick challenge cards

### Exercise Library
- Grid with hover previews
- Filter by difficulty (color-coded)
- "Favorite" star system
- Completion checkmarks

### Workout View
- Live XP counter
- Set completion with satisfying checkmarks
- PR alerts with celebration
- Rest timer with circular progress
- Motivational messages

### Leaderboard
- Podium visual for top 3
- Rank badges with icons
- Animated position changes
- Personal highlight row

### Profile
- Level badge showcase
- Achievement wall
- Stats visualization with charts
- Streak calendar heatmap
- Personal records timeline

## Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

## Elevation
- Base: No shadow
- Raised: Subtle purple glow
- Floating: Medium purple/cyan glow
- Modal: Strong glow with backdrop blur

## States

### Interactive Elements
- Default: Base color
- Hover: Glow + slight scale
- Active: Pressed scale + brightness increase
- Disabled: 40% opacity, grayscale
- Success: Green glow pulse
- Error: Red shake animation

## Iconography
- Use Lucide React for UI icons
- Custom SVG badges for achievements
- Animated icons for streaks/XP
- Trophy/medal variations for ranks

## Key Principles
1. **Immediate Feedback**: Every action should have visual/animated response
2. **Progress Visibility**: Always show how close to next reward
3. **Celebration**: Big moments deserve big animations
4. **Competitive Edge**: Rankings and comparisons fuel motivation
5. **Accessibility**: Animations respect prefers-reduced-motion
6. **Performance**: Smooth 60fps animations, no jank
