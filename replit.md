# StrideCode Pro - Elite Strength & Conditioning Platform

## Overview
**StrideCode Pro** is a comprehensive strength and conditioning platform for coaches and athletes. Tagline: "Build · Measure · Adapt". Designed to manage exercise libraries, create training programs, track athlete progress, and monitor performance metrics through an intuitive, modern interface. This platform aims to surpass existing solutions by offering a highly visual, gamified, and modern user experience. The business vision is to provide a leading-edge tool for performance optimization in strength and conditioning.

## User Preferences
- **Design Philosophy**: Clean, professional, athletic aesthetic
- **Target Users**: Strength coaches, personal trainers, athletes
- **Priority**: Visual excellence and intuitive UX

## System Architecture
The platform is built with a modern web stack, prioritizing a seamless and engaging user experience.

### Tech Stack
- **Frontend**: React 18 with TypeScript, Wouter for routing
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Shadcn UI components with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

### UI/UX Decisions & Design System
- **Color Palette**: "Ocean Depth" theme, featuring deep ocean blue, professional teal, coral energy, and professional gold. This provides a professional yet energetic feel, moving away from generic corporate aesthetics.
- **Typography**: Rajdhani (headings), Orbitron (stats), Inter (body) for a blend of professionalism and modern edge.
- **Interactive Elements**: Incorporates award-winning design patterns such as glassmorphism, magnetic interactions, breathing animations, reveal effects, gradient text, ripple feedback, and glow effects to create a dynamic and engaging interface.
- **Gamification**: Strategic use of XP, levels, streaks, and achievements with visual components like XP bars, achievement badges, and streak counters to motivate users.
- **Accessibility**: Full `prefers-reduced-motion` support and performance optimizations.
- **Layout**: Ultra-minimal, responsive design inspired by high-end sports analytics platforms, ensuring usability across desktop, tablet, and mobile.

### Technical Implementations & Feature Specifications
- **Program Management**: Coaches can create, manage, and assign training programs. Key features include:
    - **Program Templates**: Pre-built, customizable training programs across categories (Strength, Speed, Rehab, etc.).
    - **Program Builder**: Adding/removing exercises, configuring sets/reps, and organizing by week/day.
- **Athlete Management**: Comprehensive profiles, team and position tracking, and program assignment with status management.
    - **CSV Import**: TeamBuildr CSV import with PapaParse for multiline field handling, email placeholders for pending athletes, and duplicate prevention.
- **Exercise Library**: Full CRUD operations for exercises with categories, muscle groups, difficulty levels, and search/filter functionalities.
- **Workout Logging**: Intuitive interface for athletes to log workouts, tracking sets, reps, and weights. Features auto-detection of Personal Records (PRs).
- **Progress Tracking & Analytics**:
    - **Real Data Dashboard**: Displays platform-wide and per-athlete statistics (workouts, sets, PRs, XP, levels, streaks, top performers).
    - **XP and Level System**: Calculates XP based on workout activity and derives user levels.
    - **Calendar Integration**: Day-level scheduling and visualization of workouts.
    - **Progress Analytics**: Charts for strength progression, volume trends, and PR history.
- **AI Coach Assistant** (NEW):
    - **GPT-4.1 Integration**: Powered by OpenAI via Replit AI Integrations (no API key required).
    - **Three AI Endpoints**:
      - `/api/ai/insights`: Generates performance insights with athlete context (stats, PRs, recent workouts).
      - `/api/ai/recommend-program`: AI-powered program recommendations based on athlete goals and performance.
      - `/api/ai/chat`: Conversational assistant for training questions and guidance.
    - **Compliance Safeguards**: All AI responses avoid specific injury diagnoses, medical advice, and treatment recommendations - focusing on general coaching guidance only.
    - **Floating Chat Widget**: Beautiful UI with minimize/maximize, conversation history, and medical disclaimer (AlertCircle icon).
    - **Context-Aware**: AI has access to athlete stats (streak, workouts, sets, PRs) for personalized coaching.
- **Belt System Design**: Planned auto-promotion logic for athletes based on KPI test results and threshold management.

### System Design Choices
- **Data Models**: Core entities include Exercises, Athletes, Programs, Program Exercises, Athlete Programs, Workout Logs, and Personal Records.
- **Project Structure**: Organized `client/` and `server/` directories with a `shared/` folder for common TypeScript types and Zod schemas, facilitating a schema-first development approach.
- **API Design**: RESTful endpoints with Zod validation for robust data handling on both frontend and backend.
- **Development Workflow**: Employs a schema-first approach, uses React Query for data fetching, and integrates Zod validation for robust data handling.

## External Dependencies
- **PostgreSQL**: Primary database for all persistent data.
- **Drizzle ORM**: Used for interacting with the PostgreSQL database.
- **Shadcn UI**: A collection of reusable UI components based on Tailwind CSS.
- **Recharts**: JavaScript charting library for data visualization.
- **Wouter**: A tiny routing library for React.
- **React Hook Form with Zod**: For form management and validation.