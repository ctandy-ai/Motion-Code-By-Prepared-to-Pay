# MotionCode Pro - Elite Strength & Conditioning Platform

## Overview
MotionCode Pro is a premium B2B strength and conditioning platform for elite performance organizations. It enables strength coaches to manage exercise libraries, create advanced training programs, track athlete progress, and monitor performance via an intuitive, modern interface. The platform is part of the Prepared to Play ecosystem, offering a highly visual, gamified, and AI-powered coaching experience. The business aims to dominate the B2B S&C market by integrating 52-week periodization, belt progression, and engaging athlete experiences.

## User Preferences
- **Design Philosophy**: Premium dark glassmorphism theme with professional gold accents for Pro tier
- **Target Users**: B2B organizations, strength coaches, performance directors, elite athletes
- **Priority**: Visual excellence, coaching efficiency, athlete engagement
- **Branding**: Powered by Prepared to Play with MotionCode Pro premium tier identity

## System Architecture
The platform utilizes a modern web stack, focusing on an engaging user experience.

### UI/UX Decisions & Design System
The UI features an enterprise dark theme with an "Ocean Depth" color palette (deep ocean blue, professional teal, coral energy, professional gold). Typography includes Rajdhani, Orbitron, and Inter. Glassmorphism (bglass) is reserved for signature elements only (AI chat, mobile portal, dialog overlays); content cards use standard bg-card styling with rounded-lg corners for enterprise polish. A shared PageHeader component (`client/src/components/page-header.tsx`) provides consistent headers across all pages with title, description, icon, badge, and actions slots. Dashboard uses real data (no Math.random or hardcoded percentages). Gamification includes XP, levels, streaks, and achievements. The responsive layout features a collapsible Shadcn sidebar with TeamBuildr-inspired navigation. Consistent spacing is maintained.

### Technical Implementations & Feature Specifications
- **Program Templates System**: A library of 30 templates, including 24 "plug and play" pathway templates (e.g., ACL, Hamstring) with clinically-vetted exercises and a 52-week athletic performance program. Templates are searchable, filterable, and copyable for program creation.
- **Program Management (Elite Periodization System)**: A tri-pane workspace with a 52-week macro periodization timeline, a drag-and-drop weekly planner, and a sophisticated block composer. Supports CRUD operations for program elements with performance optimizations.
- **Athlete Management**: Comprehensive profiles, team/position tracking, program assignment, and CSV import.
- **Exercise System**: Includes a read-only Master Exercise Database (1,769 exercises), a custom Exercise Library with CRUD, an AI Exercise Classifier (GPT-4.1) for categorization by belt level and risk, and an RM Calculator.
- **Workout Logging**: Intuitive athlete interface for logging workouts, tracking sets/reps/weights, and auto-detecting Personal Records (PRs).
- **Progress Tracking & Analytics**: Real data dashboard, XP/level system, calendar integration, and charts for strength progression and PR history.
- **Coach Analytics Dashboard**: Comprehensive page with 5 Recharts visualizations: strength trends, PR timeline, team wellness, weekly training volume, and top exercises by PR count.
- **Team Pulse Dashboard**: At-a-glance athlete status (readiness, workout compliance, soreness) on the coach dashboard, with summary stats and quick navigation to athlete details.
- **Coach Heuristics System**: A database-backed rule engine allowing coaches to define AI-triggering rules based on athlete data (e.g., low readiness, high soreness) to prompt actions like volume reduction or exercise adjustments.
- **AI Coach Assistant**: Integrates GPT-4.1 with full program context awareness (athletes, programs, exercises, wellness, heuristics). Supports function-calling for real program modifications (e.g., adding exercises, adjusting volume) with a confirmation workflow (AI proposes -> coach approves/rejects).
- **Belt System Design**: Three-tier athlete classification (WHITE/BLUE/BLACK) based on training age, movement quality, injury history, and exposure tracking, influencing weekly budgets and exercise constraints.
- **Program Engine (Intelligent Coaching Guidance)**: A rules-based engine providing real-time guidance during program creation, including belt classification, weekly budget calculation for plyo contacts, hard lower sets, and speed touches, phase types, wave weeks, stage overlay constraints for RTP/ACL athletes, and global stop rules.
- **Athlete Training Profile**: Per-athlete meta-data (training age, movement quality, injury flags, exposure counts) for Program Engine input, editable on the athlete detail page.
- **Enhanced Program Builder**: An enterprise-level visual program builder at `/programs/:programId/build` featuring an Exercise Sidebar, a 7-day WeekDayGrid with drag-and-drop, and Inline Engine Guidance displaying budget bars.
- **Mobile Athlete Portal**: Touch-optimized mobile experience for athletes at `/m/*` routes, including a dashboard, workout logging, daily wellness check-ins, athlete-coach messaging, profile view, and RPE logging, with bottom tab navigation.
- **VALD Hub Integration**: Connects to the VALD Hub API for syncing athlete testing data (ForceDecks, NordBord, etc.), including OAuth 2.0 authentication, profile syncing, test data synchronization, display on athlete profiles, and AI Coach context integration.
- **AI-Powered Athlete Onboarding**: A conversational interface using GPT-4.1 for creating athletes from natural language descriptions, extracting data, predicting belt classification, and suggesting programs, with coach review and confirmation.
- **AI Intelligence System (AI Command Center)**: A unified multi-level AI intelligence accessible from `/ai-command-center` offering insights, suggestions, and predictions at athlete, program, exercise, team, analytics, and coaching levels. It provides structured JSON responses and maintains the "AI proposes, coach disposes" philosophy.
- **Enhanced Coach Dashboard**: Enterprise-grade dashboard with interactive Recharts visualizations (Team Pulse, Weekly Activity Trends, Belt Distribution), quick actions, recent message previews, and program status cards.
- **Coach Messaging Center**: A thread-based conversation system at `/coach/messages` with a searchable athlete list, full conversation history, broadcast messaging, read receipts, and real-time updates.
- **Bulk Operations System**: Enterprise efficiency features on the Athletes page, including multi-select for bulk program assignment and bulk messaging.
- **Role-Based Access Control (RBAC)**: Enterprise security framework with user roles (ADMIN, HEAD_COACH, ASSISTANT_COACH, ATHLETE) and associated permission sets, utilizing authorization middleware and client-side hooks.
- **Audit Logging System**: Enterprise compliance tracking with a `audit_logs` database table, recording action types, resource types, user information, and timestamps, accessible via an Audit Logs page.

### System Design Choices
- **Tech Stack**: React 18 (TypeScript, Wouter) for frontend; Express.js (TypeScript) for backend; PostgreSQL with Drizzle ORM; Shadcn UI with Tailwind CSS for UI; Recharts for charting; React Hook Form with Zod for forms.
- **Data Models**: Core entities include Exercises, Athletes, Programs, Workout Logs, Program Phases, Weeks, Training Blocks, and Block Exercises.
- **Project Structure**: Organized `client/`, `server/`, and `shared/` directories, emphasizing schema-first development.
- **API Design**: RESTful endpoints with Zod validation and composite queries.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: Database interaction.
- **Shadcn UI**: UI components.
- **Recharts**: Data visualization.
- **Wouter**: React routing.
- **React Hook Form with Zod**: Form management and validation.
- **@dnd-kit**: Drag-and-drop functionality.
- **OpenAI (via Replit AI Integrations)**: For AI Coach Assistant (GPT-4.1).