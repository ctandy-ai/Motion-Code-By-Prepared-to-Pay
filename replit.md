# Elite Strength & Conditioning Platform

## Overview
A comprehensive strength and conditioning platform for coaches and athletes, designed to rival and surpass TeamBuildr. The platform enables coaches to manage exercise libraries, create training programs, track athlete progress, and monitor performance metrics through an intuitive, modern interface.

## Project Status
**Current Phase**: MVP Development - Core Features Complete (Tasks 1-5/7)

## Recent Changes
- **2025-11-03**: CORE FEATURES COMPLETE - Tasks 1-5 ✅ DONE
  - **Task 1**: Enterprise design polish - Ultra-minimal aesthetic, Ocean Depth palette
  - **Task 2**: Program Builder - Add/remove exercises, week/day organization, sets/reps config
  - **Task 3**: Athlete-Program Assignments - Assignment interface, date tracking, status management
  - **Task 4**: Workout Logging - Multi-athlete support, sets/reps/weight input, PR auto-calculation
  - **Task 5**: Real Data Dashboard - All mock data replaced with live calculations
    - `/api/dashboard-stats`: Aggregate platform statistics
    - `/api/athletes/:id/stats`: Per-athlete verification endpoint
    - XP Formula: (workouts × 50) + (sets × 10) + (PRs × 100)
    - Level Formula: floor(sqrt(XP / 100)) + 1
    - Streak tracking from workout_logs
    - Top performers ranked by XP
  - **Critical Bug Fixes**:
    - Set counting now uses `log.sets` integer field (not string splitting)
    - State cleanup on athlete switch prevents cross-athlete data leakage
    - All XP calculations consistent across endpoints
  
- **2025-11-02**: PROFESSIONAL COLOR PALETTE REDESIGN - Ocean Depth Theme ✅ COMPLETE
  - **Inspired by Lumin Sports, Made Better**: Studied their professional approach, then improved it
  - **Ocean Depth Palette**: Deep ocean blue (primary), professional teal (achievements), coral energy (CTAs), professional gold
  - **Complete Migration**: ALL color variables updated across light/dark modes
    - Neutrals: 210 hue (ocean blue tint) for backgrounds, cards, borders, text
    - Primary: 200 hue (deep ocean blue) for actions, XP bars, primary interactions
    - Accent: 175 hue (professional teal) for achievements, highlights
    - Shadows: 210 hue (ocean blue tint) for all elevation levels
    - Charts: Ocean Depth palette (ocean blue, coral, teal-green, teal, gold)
  - **Professional Credibility**: More trustworthy than gaming purple, still energetic
  - **Unique Identity**: Distinctive teal accents, cohesive blue undertones throughout
  - **Better Than Lumin**: Added gamification layer they don't have, modern interactions, award-winning design
  - Maintained all gamification features (XP, achievements, streaks, challenges)
  - Kept award-winning interactions (glassmorphism, magnetic hover, breathing animations)
  - Full accessibility support (prefers-reduced-motion)
  - Performance optimized (minimal backdrop-filter usage)

- **2025-10-31**: AWARD-WINNING DESIGN IMPLEMENTATION - Premium Gamified Platform
  - Design Research: Studied Awwwards Site of the Year 2024, Webby Winners, FWA recipients
  - Glassmorphism, magnetic interactions, breathing animations, reveal effects
  - Gradient text, ripple feedback, glow effects
  - Typography: Rajdhani (headings), Orbitron (stats), Inter (body)
  - Database: PostgreSQL with Drizzle ORM
  - Full accessibility and performance optimizations

## Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript, Wouter for routing
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for full data persistence
- **UI Framework**: Shadcn UI components with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

### Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn UI components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── stat-card.tsx
│   │   │   └── exercise-card.tsx
│   │   ├── pages/
│   │   │   ├── dashboard.tsx
│   │   │   ├── exercises.tsx
│   │   │   ├── athletes.tsx
│   │   │   ├── programs.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── progress.tsx
│   │   ├── App.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/
│   └── schema.ts           # Shared TypeScript types and Zod schemas
└── design_guidelines.md    # Comprehensive design system documentation
```

## Data Models

### Core Entities
1. **Exercises**: Exercise library with categories, muscle groups, difficulty levels, and video demonstrations
2. **Athletes**: Athlete profiles with team and position information
3. **Programs**: Training programs with duration and description
4. **Program Exercises**: Individual exercises within programs with sets, reps, and scheduling
5. **Athlete Programs**: Assignment of programs to athletes with status tracking
6. **Workout Logs**: Completed workout data with sets, reps, and weights
7. **Personal Records**: Athlete PRs for specific exercises

## Features Implemented

### ✅ Completed Features (Tasks 1-5)
- **Real Data Dashboard** ✅:
  - Live statistics from workout_logs and personal_records
  - XP calculation: (workouts × 50) + (sets × 10) + (PRs × 100)
  - Level progression: floor(sqrt(XP / 100)) + 1
  - Active streak tracking (consecutive workout days)
  - Top performers leaderboard with real XP rankings
  - Activity overview with total workouts, sets, and PRs
  - Performance level card with XP progress bar

- **Workout Logging Interface** ✅:
  - Multi-athlete workout selector (dropdown)
  - Today's scheduled workouts from athlete_programs
  - Sets/reps/weight input with dynamic set management
  - Save to workout_logs table with validation
  - PR auto-detection and creation
  - State cleanup on athlete switch (prevents data leakage)

- **Program Builder** ✅:
  - Add/remove exercises to programs
  - Week and day organization (drag-and-drop coming later)
  - Sets, reps, and week configuration per exercise
  - Real database operations (program_exercises table)
  - Exercise library integration

- **Athlete-Program Assignment System** ✅:
  - Assignment interface on Athletes page
  - Multi-athlete and multi-program selection
  - Start/end date tracking
  - Status management (active/completed/pending)
  - Display assigned athletes per program

- **Exercise Library** ✅: 
  - Full CRUD operations (Create, Read, Update, Delete)
  - Edit dialog with form validation
  - Filter by category and muscle group
  - Search functionality across exercise names
  - Exercise cards with metadata and badges
  - Seed data: 5 exercises

- **Athlete Management** ✅:
  - Create and delete athlete profiles
  - Search capabilities
  - Team and position tracking
  - Seed data: 5 athletes with realistic profiles

- **Program Management** ✅:
  - Create and delete training programs
  - Program duration and descriptions
  - Exercise assignment workflow

- **Database** ✅: 
  - PostgreSQL with Drizzle ORM
  - Full data persistence across all features
  - Seed data loaded

- **Backend API** ✅: 
  - RESTful endpoints with Zod validation
  - `/api/dashboard-stats` - Platform statistics
  - `/api/athletes/:id/stats` - Per-athlete verification
  - All CRUD operations for exercises, athletes, programs
  - Workout logging and PR tracking endpoints

- **Enterprise Design** ✅:
  - Ocean Depth professional color palette
  - Ultra-minimal layout (Lumin-inspired)
  - Strategic gamification (XP, levels, streaks)
  - Dark mode support
  - Responsive design (desktop/tablet/mobile)
  - Accessibility optimizations

### 🚧 Remaining Tasks (2/7)
- **Task 6**: Calendar Integration - Connect to real workout data, show scheduled vs completed
- **Task 7**: Progress Analytics - Real strength charts, volume trends, PR history with filters

### ✨ Design Excellence Achieved
- **Accessibility**: Full `prefers-reduced-motion` support for all animations
- **Performance**: Optimized backdrop-filter usage for smooth 60fps performance
- **Award-Winning Patterns**: Magnetic hover, gradient text, breathing animations, reveal effects
- **Gaming Aesthetic**: Electric purple/cyan theme with neon accents and glassmorphism

### 📋 Planned Features
- Real-time workout tracking
- Video playback for exercises
- Program assignment workflow
- Advanced analytics and reporting
- Export capabilities
- Team communication features

## Design System

### Colors (Gamified Theme)
- **Primary**: Electric Purple (hsl(270, 91%, 65%)) - XP bars, primary actions, level-ups
- **Accent**: Neon Cyan (hsl(180, 100%, 50%)) - Achievements, highlights, streaks
- **Challenge**: Vibrant Orange (hsl(25, 95%, 58%)) - Daily challenges, warnings
- **Success**: Green (hsl(142, 71%, 45%)) - Completed workouts, PRs
- **Backgrounds**: Deep space (hsl(240, 15%, 8%)) with charcoal cards
- **Achievements**: Gold/Silver/Bronze metallic gradients for rarity tiers

### Typography
- **Primary Font**: Inter - Clean, readable sans-serif for UI
- **Heading Font**: Rajdhani - Bold, futuristic, gaming-inspired headings
- **Display Font**: Orbitron - Tech/gaming aesthetic for stats and numbers
- **Scale**: Consistent type scale from xs (12px) to 4xl (56px)

### Components
- Shadcn UI components for consistency
- **XPBar**: Gradient progress bar with shimmer animation, level badges with trophy icons
- **AchievementBadge**: Rarity-based metallic gradients, shine effects, unlock dates
- **StreakCounter**: Fire/ice animations, current vs. longest streak display
- **DailyChallengeCard**: Progress tracking, XP rewards, accept/complete states
- Custom stat cards with game-like number displays
- Exercise cards with hover glow effects
- Responsive sidebar navigation with purple accents
- Calendar grid with day cells
- Chart components for analytics

### Spacing & Layout
- Tailwind spacing scale (2, 4, 6, 8, 12, 16, 24)
- Max-width containers (max-w-7xl)
- Grid layouts for responsive content
- Proper padding and margins throughout

## User Preferences
- **Design Philosophy**: Clean, professional, athletic aesthetic
- **Target Users**: Strength coaches, personal trainers, athletes
- **Priority**: Visual excellence and intuitive UX

## API Endpoints

### Dashboard & Stats
- `GET /api/dashboard-stats` - Platform-wide statistics (workouts, sets, PRs, XP, levels, streaks, top athletes)
- `GET /api/athletes/:id/stats` - Per-athlete stats verification (workouts, sets, PRs, XP, level)

### Exercises
- `GET /api/exercises` - List all exercises
- `POST /api/exercises` - Create new exercise
- `PATCH /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Athletes
- `GET /api/athletes` - List all athletes
- `GET /api/athletes/:id` - Get athlete details
- `POST /api/athletes` - Create new athlete
- `DELETE /api/athletes/:id` - Delete athlete

### Programs
- `GET /api/programs` - List all programs
- `GET /api/programs/:id` - Get program details
- `POST /api/programs` - Create new program
- `DELETE /api/programs/:id` - Delete program

### Program Exercises
- `GET /api/programs/:id/exercises` - List exercises in program
- `POST /api/programs/:id/exercises` - Add exercise to program
- `DELETE /api/program-exercises/:id` - Remove exercise from program

### Athlete Programs
- `GET /api/athlete-programs` - List all athlete-program assignments
- `GET /api/athlete-programs/athlete/:athleteId` - Get programs for athlete
- `POST /api/athlete-programs` - Assign program to athlete
- `DELETE /api/athlete-programs/:id` - Unassign program from athlete

### Workout Logs
- `GET /api/workout-logs` - Get all workout history
- `GET /api/workout-logs/:athleteId` - Get athlete's workout history
- `POST /api/workout-logs` - Log workout completion

### Personal Records
- `GET /api/personal-records` - Get all PRs
- `GET /api/personal-records/:athleteId` - Get athlete's PRs
- `POST /api/personal-records` - Create new PR

## Development Workflow
1. Schema-first approach with TypeScript types
2. Frontend components built with Shadcn UI
3. Backend API following RESTful conventions
4. React Query for data fetching and caching
5. Zod validation on both frontend and backend

## Notes
- All forms use React Hook Form with Zod validation
- Charts use Recharts library for consistency
- Sidebar uses Shadcn's Sidebar component
- Theme toggle persists to localStorage
- All interactive elements have proper data-testid attributes for testing
