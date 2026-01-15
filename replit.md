# MotionCode Pro - Elite Strength & Conditioning Platform

## Overview
**MotionCode Pro** is the premium B2B strength and conditioning platform designed for elite performance organizations. It empowers strength coaches to manage exercise libraries, create sophisticated training programs, track athlete progress, and monitor performance metrics through an intuitive, modern interface. Part of the **Prepared to Play** ecosystem, this platform delivers a highly visual, gamified, and AI-powered coaching experience. The business vision is to become the dominant B2B S&C platform by combining 52-week periodization, belt progression mastery, and engagement-grade athlete experiences.

## User Preferences
- **Design Philosophy**: Premium dark glassmorphism theme with professional gold accents for Pro tier
- **Target Users**: B2B organizations, strength coaches, performance directors, elite athletes
- **Priority**: Visual excellence, coaching efficiency, athlete engagement
- **Branding**: Powered by Prepared to Play with MotionCode Pro premium tier identity

## System Architecture
The platform is built with a modern web stack, prioritizing a seamless and engaging user experience.

### UI/UX Decisions & Design System
The UI features a premium dark glassmorphism theme with an "Ocean Depth" color palette, incorporating deep ocean blue, professional teal, coral energy, and professional gold. Typography uses Rajdhani, Orbitron, and Inter. Interactive elements include magnetic interactions, breathing animations, reveal effects, gradient text, ripple feedback, and glow effects. Gamification is integrated with XP, levels, streaks, and achievements. The ultra-minimal, responsive layout includes a collapsible Shadcn sidebar with professional gold accents and dark glassmorphism styling, and a TeamBuildr-inspired navigation hierarchy for coach tools. Consistent spacing is maintained throughout.

### Technical Implementations & Feature Specifications
- **Program Templates System**: Features a library of 30 templates, including 24 "plug and play" pathway templates (ACL, Hamstring, Performance) with pre-populated, clinically-vetted exercises. Includes a 52-week athletic performance program. Templates can be searched, filtered, and copied to create editable programs. A `template-seeder` module generates pathway templates, and a `CSV-importer` handles external program imports.
- **Program Management (Elite Periodization System)**: Offers a tri-pane workspace with a 52-week macro periodization timeline (`PhaseTimeline`), a drag-and-drop weekly planner (`WeeklyPlanner`) for training blocks, and a sophisticated block composer (`BlockComposer`). The system supports CRUD operations for phases, weeks, blocks, and block exercises, with performance optimizations for fast loading and an optimized database schema.
- **Athlete Management**: Comprehensive profiles, team/position tracking, and program assignment. Supports CSV import for athlete data.
- **Exercise System**: Includes a read-only Master Exercise Database (1,769 exercises) with advanced filtering, a custom Exercise Library with full CRUD operations, an AI Exercise Classifier (GPT-4.1) for categorizing exercises by belt level and risk, and an RM Calculator using 7 validated formulas.
- **Workout Logging**: Intuitive interface for athletes to log workouts, track sets/reps/weights, and auto-detect Personal Records (PRs).
- **Progress Tracking & Analytics**: Features a real data dashboard, XP and level system, calendar integration, and charts for strength progression and PR history.
- **Coach Analytics Dashboard**: Comprehensive analytics page with 5 Recharts visualizations: strength progression trends (30-day), PR timeline history, team wellness metrics (14-day readiness/sleep/energy), weekly training volume (sets/workouts), and top exercises by PR count.
- **Coach Heuristics System**: Database-backed rule engine (coach_heuristics table) allowing coaches to define AI-triggering rules. Supports trigger types (readiness_low, soreness_high, missed_sessions, etc.), action types (reduce_volume, add_exercises, flag_review), priority levels, and active/inactive toggles. Full CRUD UI for rule management.
- **AI Coach Assistant**: Integrates GPT-4.1 via Replit AI Integrations with full program context awareness. Builds comprehensive context from athletes, programs, blocks, exercises, wellness surveys, and coach heuristics. Features function-calling for real program modifications (add exercises, adjust volume, flag athletes, assign programs). Includes confirmation workflow: AI proposes changes -> saves to pendingAiActions table -> coach approves/rejects -> backend executes storage operations. Compliance safeguards avoid medical advice.
- **Belt System Design**: Planned auto-promotion logic for athletes based on KPI test results.

### System Design Choices
- **Tech Stack**: React 18 with TypeScript and Wouter for frontend; Express.js with TypeScript for backend; PostgreSQL with Drizzle ORM for the database; Shadcn UI with Tailwind CSS for UI; Recharts for charting; React Hook Form with Zod for forms.
- **Data Models**: Core entities include Exercises, Athletes, Programs, Workout Logs, Program Phases, Weeks, Training Blocks, and Block Exercises.
- **Project Structure**: Organized `client/`, `server/`, and `shared/` directories, emphasizing a schema-first development approach.
- **API Design**: RESTful endpoints with Zod validation and composite queries for performance.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Database interaction.
- **Shadcn UI**: UI components.
- **Recharts**: Data visualization.
- **Wouter**: React routing.
- **React Hook Form with Zod**: Form management and validation.
- **@dnd-kit**: Drag-and-drop functionality.
- **OpenAI (via Replit AI Integrations)**: For AI Coach Assistant (GPT-4.1).