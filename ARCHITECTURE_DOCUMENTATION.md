# Motion Code - Complete Architecture Documentation

## Executive Summary

**Motion Code** (formerly RunStrong Pro) is a professional SaaS platform for Strength & Conditioning coaches and physiotherapists, focusing on exercise programming for running performance in field and court sport athletes. The platform features subscription-based access, video exercise library, program management, and athlete tracking.

**Tech Stack**: TypeScript, React, Express.js, PostgreSQL (Neon), Stripe, Replit Auth, Replit Object Storage

---

## 1. DATABASE SCHEMA & DATA MODEL

### Core Tables & Relationships

#### Organizations (Multi-tenant Structure)
```typescript
organizations {
  id: serial PRIMARY KEY
  name: text
  subscriptionStatus: text (trial|active|expired|cancelled)
  subscriptionTier: text (basic|pro|enterprise)
  maxCoaches: integer (default: 1)
  maxAthletes: integer (default: 10)
  stripeCustomerId: varchar
  stripeSubscriptionId: varchar
  trialEndsAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Users (Role-based Access Control)
```typescript
users {
  id: varchar PRIMARY KEY (Replit Auth ID)
  email: varchar UNIQUE
  firstName: varchar
  lastName: varchar
  profileImageUrl: varchar
  role: text (admin|coach|athlete) DEFAULT 'athlete'
  organizationId: integer → organizations.id
  coachId: varchar → users.id (self-reference for athlete-coach relationship)
  isActive: boolean DEFAULT true
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Relationships:**
- Organizations have many Users
- Users belong to one Organization
- Coaches can have many Athletes (via coachId)
- Athletes assigned to one Coach

#### Exercises (P2P Professional Library + Custom)
```typescript
exercises {
  id: serial PRIMARY KEY
  name: text
  description: text
  category: text
  component: text (acceleration|deceleration|change-direction|top-speed)
  beltLevel: text (white|blue|black)
  duration: text
  equipment: text
  coachingCues: text[]
  videoUrl: text (Object storage path: /objects/Videos/...)
  thumbnailUrl: text (API endpoint: /api/thumbnails/:id)
  
  // SpeedPowerPlay-style classification
  skillFocus: text[] (strength|stability|coordination|power|agility)
  progressionLevel: integer (1-10 progressive difficulty)
  weekIntroduced: integer
  trainingPhase: text (foundation|development|peak|maintenance)
  complexityRating: integer (1-5 movement complexity)
  
  // Custom exercise tracking
  isCustom: boolean DEFAULT false
  createdByUserId: varchar → users.id
  organizationId: integer → organizations.id
  createdAt: timestamp
}
```

**Exercise Classification System:**
- **4 Movement Components**: Starting (Acceleration), Stopping (Deceleration), Stepping (Change of Direction), Sprinting (Top Speed)
- **3 Belt Levels**: White (rudimentary), Blue (intermediate), Black (advanced)
- **37 Professional P2P Videos**: Pre-classified plyometric library
- **Custom Exercises**: Coaches can create organization-specific exercises

#### Programs (SpeedPowerPlay-style Structured Programs)
```typescript
programs {
  id: serial PRIMARY KEY
  name: text
  description: text
  createdByUserId: varchar → users.id
  organizationId: integer → organizations.id
  isTemplate: boolean DEFAULT false
  
  // Program structure
  programType: text (foundation|development|peak|custom)
  totalWeeks: integer DEFAULT 12 (9|12|16 week programs)
  sessionsPerWeek: integer DEFAULT 3
  targetPopulation: text[] (field-sports|court-sports|endurance|strength)
  skillEmphasis: text[] (strength|power|agility|stability|coordination)
  equipmentRequired: text[] (bodyweight|basic|advanced)
  difficultyLevel: text (beginner|intermediate|advanced)
  
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Program Sessions (Individual Workouts)
```typescript
programSessions {
  id: serial PRIMARY KEY
  programId: integer → programs.id
  name: text
  description: text
  dayOfWeek: integer (1-7 for recurring programs)
  sessionOrder: integer
  createdAt: timestamp
}
```

#### Session Exercises (Exercise Prescription)
```typescript
sessionExercises {
  id: serial PRIMARY KEY
  sessionId: integer → programSessions.id
  exerciseId: integer → exercises.id
  sets: integer
  reps: text (flexible: "8-12", "10", "AMRAP")
  weight: text (flexible: "bodyweight", "50kg", "RPE 7")
  rest: text
  notes: text
  exerciseOrder: integer
  createdAt: timestamp
}
```

#### Athlete Programs (Assignment Tracking)
```typescript
athletePrograms {
  id: serial PRIMARY KEY
  athleteId: varchar → users.id
  programId: integer → programs.id
  assignedByUserId: varchar → users.id
  startDate: timestamp
  endDate: timestamp
  status: text (active|completed|paused)
  createdAt: timestamp
}
```

#### Workout Logs (Session Completion)
```typescript
workoutLogs {
  id: serial PRIMARY KEY
  athleteId: varchar → users.id
  programId: integer → programs.id
  sessionId: integer → programSessions.id
  workoutDate: timestamp
  status: text (planned|in_progress|completed|skipped)
  notes: text
  completedAt: timestamp
  createdAt: timestamp
}
```

#### Exercise Logs (Individual Exercise Tracking)
```typescript
exerciseLogs {
  id: serial PRIMARY KEY
  workoutLogId: integer → workoutLogs.id
  exerciseId: integer → exercises.id
  sessionExerciseId: integer → sessionExercises.id
  actualSets: integer
  actualReps: text
  actualWeight: text
  actualRest: text
  rpe: integer (1-10 Rate of Perceived Exertion)
  notes: text
  completedAt: timestamp
  createdAt: timestamp
}
```

### Database Technology
- **ORM**: Drizzle ORM with TypeScript
- **Provider**: Neon Database (Serverless PostgreSQL)
- **Migrations**: Drizzle Kit (`npm run db:push`)
- **Session Storage**: PostgreSQL-backed sessions via `connect-pg-simple`

---

## 2. SYSTEM ARCHITECTURE

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR, optimized builds)
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query v5 (React Query) for server state
- **Routing**: Wouter (lightweight client-side routing)
- **Forms**: React Hook Form + Zod validation

#### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth (OpenID Connect)
- **Payments**: Stripe API (subscriptions with trials)
- **File Storage**: Replit Object Storage (video hosting)
- **Database**: PostgreSQL via Drizzle ORM

#### Development Tools
- **Dev Server**: Vite dev server with HMR
- **Build**: ESBuild (server) + Vite (client)
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Route pages (Landing, Dashboard, Exercise Library)
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/          # Utilities, API client, React Query setup
│   │   └── App.tsx       # Route configuration
│
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database abstraction layer
│   ├── replitAuth.ts     # Authentication setup
│   ├── objectStorage.ts  # Video file handling
│   └── thumbnailService.ts # Video thumbnail generation
│
├── shared/               # Shared TypeScript types
│   └── schema.ts        # Drizzle schemas & Zod validators
│
├── migrations/          # Database migrations
└── dist/               # Production build output
```

### Request Flow

**1. Authentication Flow:**
```
User → Login with Replit Auth → OpenID Connect → Session Storage (PostgreSQL)
→ User profile fetched → Role-based access control
```

**2. Exercise Library Flow:**
```
Frontend (React Query) → GET /api/exercises?component=acceleration
→ Storage layer (Drizzle ORM) → PostgreSQL → Exercises returned
→ Video thumbnails: GET /api/thumbnails/:id → SVG placeholder
→ Video playback: GET /objects/Videos/... → Object Storage → Video stream
```

**3. Subscription Check Flow:**
```
Protected Route → requireValidSubscription middleware
→ Check user.organizationId → Fetch organization
→ Verify subscriptionStatus (trial|active) → Check trialEndsAt
→ If invalid: 403 error → Frontend redirects to upgrade page
```

---

## 3. FEATURES & FUNCTIONALITY

### Implemented Features

#### 1. **Authentication & User Management**
- Replit Auth integration (OpenID Connect)
- Role-based access: Admin, Coach, Athlete
- Session management with PostgreSQL storage
- User profile with organization membership
- Coach-athlete relationship assignment

#### 2. **Exercise Library (37 Professional P2P Videos)**
- 4 Movement Components filtering (Acceleration, Deceleration, Change of Direction, Top Speed)
- 3 Belt Levels (White, Blue, Black)
- Real-time search functionality
- Video preview modal with Dialog component
- SVG placeholder thumbnails
- Full exercise details (description, coaching cues, equipment)
- SpeedPowerPlay-style classification (skill focus, progression level, complexity)

#### 3. **Video System**
- 37 professional videos stored in Replit Object Storage
- Videos accessible via `/objects/Videos/...` routes
- SVG thumbnail generation at `/api/thumbnails/:id`
- Video modal player with controls
- Object storage integration for secure video hosting

#### 4. **Subscription Management (Stripe)**
- 14-day free trial for new organizations
- $29/month subscription pricing
- Stripe Customer creation with metadata
- Automatic subscription status tracking
- Trial expiration checking
- Subscription-gated content access

#### 5. **Custom Exercise Creation**
- Coaches can create organization-specific exercises
- Full exercise metadata (name, description, cues, video upload)
- Integration with existing exercise library
- Custom exercise isolation per organization

#### 6. **Program Management (TeamBuildr-style)**
- Create structured workout programs (9/12/16 weeks)
- Define sessions per week, target population, skill emphasis
- Program templates for reusability
- Session creation with exercise prescription (sets, reps, weight, RPE)
- Assign programs to athletes with start/end dates

#### 7. **Workout Logging**
- Athletes log completed workouts
- Track actual vs. prescribed performance
- RPE (Rate of Perceived Exertion) tracking
- Session notes and completion timestamps
- Exercise-level granular logging

### Pending/Future Features
- FFmpeg video thumbnail generation (currently using SVG placeholders)
- Video upload for custom exercises
- Analytics dashboard for coach insights
- Progress tracking visualizations
- Team/organization management UI
- Mobile app companion

---

## 4. INTEGRATION POINTS

### Replit Integrations

#### 1. **Replit Auth (OpenID Connect)**
```typescript
// server/replitAuth.ts
setupAuth(app) → OpenID client configuration
→ Session middleware (connect-pg-simple)
→ Passport.js authentication strategy
→ Callback URL: /api/auth/callback
→ User profile sync to database
```

**Environment Variables:**
- `REPLIT_DEPLOYMENT` - Deployment environment detection
- Session stored in PostgreSQL `sessions` table

#### 2. **Replit Object Storage**
```typescript
// server/objectStorage.ts
import { Client } from "@replit/object-storage"

listVideosInDirectory(directory) → List .MOV/.mp4 files
getVideoUrl(path) → Generate signed/public URL
downloadVideo(path) → Stream video for thumbnail generation
```

**Storage Structure:**
```
repl-default-bucket-$REPL_ID/
  Videos/
    Videos/
      Starting - white belt/
      Starting - blue belt/
      Stopping - white belt/
      Stepping - white belt/
      ...
```

**Video Serving:**
- Route: `GET /objects/*` → Express static middleware → Object Storage
- Content-Type: `video/quicktime`, `video/mp4`
- Cache-Control: `public, max-age=3600`

#### 3. **PostgreSQL Database (Neon)**
```typescript
// Drizzle ORM configuration
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)
```

**Environment Variables:**
- `DATABASE_URL` - Connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

#### 4. **Stripe Payment Integration**
```typescript
// server/routes.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

POST /api/create-payment-intent
→ Create Stripe Customer
→ Create Subscription with trial_period_days: 14
→ Store stripeCustomerId, stripeSubscriptionId in organizations table
→ Set trialEndsAt timestamp
```

**Environment Variables:**
- `STRIPE_SECRET_KEY` - Stripe API key
- `VITE_STRIPE_PUBLIC_KEY` - Frontend Stripe.js key

**Stripe Objects Created:**
- Customer (with user metadata)
- Subscription (with $29/month pricing)
- Payment Method (attached to customer)

---

## 5. API DESIGN

### Authentication Routes

#### `GET /api/auth/user` (Protected)
**Purpose**: Fetch current authenticated user  
**Auth**: Required (isAuthenticated middleware)  
**Response**: `User` object with organization data

```typescript
Response: {
  id: string
  email: string
  firstName: string
  role: "admin" | "coach" | "athlete"
  organizationId: number
  // ... other user fields
}
```

---

### Exercise Routes

#### `GET /api/exercises`
**Purpose**: Fetch exercises with advanced filtering  
**Auth**: Public  
**Query Params**:
- `component` - Filter by movement component
- `beltLevel` - Filter by belt level
- `search` - Full-text search
- `skillFocus` - Comma-separated skill focuses
- `trainingPhase` - Filter by training phase
- `progressionLevel` - Filter by progression level (1-10)
- `weekIntroduced` - Filter by week introduced
- `complexityRating` - Filter by complexity (1-5)

**Response**: `Exercise[]` array

#### `GET /api/exercises/:id`
**Purpose**: Fetch single exercise by ID  
**Auth**: Public  
**Response**: `Exercise` object

#### `POST /api/exercises` (Protected)
**Purpose**: Create custom exercise (coaches only)  
**Auth**: Required + Valid Subscription  
**Body**: `InsertExercise` schema (validated with Zod)  
**Response**: Created `Exercise` object

---

### Video Routes

#### `GET /api/thumbnails/:exerciseId`
**Purpose**: Generate SVG thumbnail for exercise video  
**Auth**: Public  
**Response**: `image/svg+xml` (640x360 SVG with play button)

**Current Implementation:**
```typescript
// Returns SVG placeholder with:
- Exercise name
- Component and belt level
- Play button icon
- Branded colors (#1e293b background, #3b82f6 accent)
```

**Planned**: FFmpeg video thumbnail extraction (technical issues with fluent-ffmpeg)

#### `GET /objects/*`
**Purpose**: Stream video files from object storage  
**Auth**: Public (future: subscription-gated)  
**Response**: Video stream (video/quicktime, video/mp4)

---

### Subscription Routes

#### `POST /api/create-payment-intent` (Protected)
**Purpose**: Start subscription with trial  
**Auth**: Required  
**Body**:
```typescript
{
  organizationName: string
  organizationType: string
  organizationDescription?: string
}
```

**Process**:
1. Create Stripe Customer with user metadata
2. Create Subscription with 14-day trial
3. Create Organization in database
4. Link user to organization with admin role
5. Return client secret for payment confirmation

**Response**:
```typescript
{
  clientSecret: string
  subscriptionId: string
  organizationId: number
}
```

---

### Program Routes (Planned/Partial Implementation)

#### `POST /api/programs` (Protected)
**Purpose**: Create workout program  
**Auth**: Coach or Admin  
**Body**: `InsertProgram` schema

#### `GET /api/programs/:id`
**Purpose**: Fetch program with sessions and exercises  
**Auth**: Organization member  
**Response**: Program with nested sessions and exercises

---

## 6. VIDEO SYSTEM ARCHITECTURE

### Video Storage & Delivery

**Storage Location**: Replit Object Storage  
**Bucket**: `repl-default-bucket-$REPL_ID`  
**Directory Structure**:
```
Videos/Videos/
  Starting - white belt/
    Split jump w exchange_.MOV
    ...
  Starting - blue belt/
    Pogo Split Jump_.MOV
    ...
  Stopping - white belt/
    Depth Drop to Stick_.MOV
    ...
  Stepping - white belt/
    Lateral Bound & Stick_.MOV
    ...
  Sprinting - white belt/
    Fast skips_.MOV
    ...
```

**Video Inventory (37 Professional P2P Videos)**:
- 10 Top-Speed videos
- 8 Acceleration videos  
- 12 Change-Direction videos
- 8 Deceleration videos

### Video Serving Flow

1. **Exercise Query**: Frontend fetches exercise → includes `videoUrl` field
2. **Thumbnail Display**: `<img src={exercise.thumbnailUrl}>` → SVG from `/api/thumbnails/:id`
3. **Video Playback**: User clicks → Dialog modal opens → `<video src={exercise.videoUrl}>`
4. **Video Stream**: Express serves `/objects/Videos/...` → Object Storage client streams file
5. **Caching**: Videos cached with `Cache-Control: public, max-age=3600`

### Thumbnail Generation

**Current Implementation (SVG Placeholders)**:
```typescript
// server/routes.ts - /api/thumbnails/:exerciseId
GET /api/thumbnails/:exerciseId
→ Fetch exercise from database
→ Generate SVG with exercise name, component, belt level
→ Return image/svg+xml with play button icon
```

**Planned Implementation (FFmpeg)**:
```typescript
// server/thumbnailService.ts (not working yet)
generateThumbnailFromVideo(videoPath)
→ Download video from object storage
→ Use fluent-ffmpeg to extract frame at 00:00:01
→ Generate JPEG thumbnail (640x360)
→ Return Buffer
```

**Technical Issue**: FFmpeg binary not available in Replit environment, causing thumbnail generation to fail. Currently using SVG placeholders as workaround.

---

## 7. USER FLOWS

### Flow 1: New User Sign-Up & Trial Activation

1. **Landing Page**: User visits `/` → sees features, pricing
2. **Sign In**: Clicks "Get Started" → Replit Auth login
3. **Create Organization**: Redirected to `/dashboard` → prompted to create organization
4. **Trial Setup**: Enters organization details → `POST /api/create-payment-intent`
5. **Stripe Payment**: Stripe subscription created with 14-day trial
6. **Organization Created**: User becomes admin → linked to organization
7. **Access Granted**: User can now access exercise library, create programs
8. **Trial Countdown**: System tracks `trialEndsAt` → shows countdown in UI

### Flow 2: Exercise Library Browsing

1. **Navigate**: User clicks "Exercise Library" in navigation
2. **Subscription Check**: Middleware verifies organization.subscriptionStatus (trial/active)
3. **Library View**: `/exercise-library` page loads
4. **Component Filter**: User selects "Acceleration" tab → `GET /api/exercises?component=acceleration`
5. **Search**: User types "jump" → `GET /api/exercises?search=jump`
6. **Exercise Cards**: Grid displays exercises with SVG thumbnails
7. **Video Preview**: User clicks exercise → Dialog modal opens → video plays
8. **Close Modal**: User closes modal → returns to library grid

### Flow 3: Coach Creates Custom Exercise

1. **Navigate**: Coach opens "Create Exercise" form
2. **Fill Form**: Enters name, description, component, belt level, coaching cues
3. **Upload Video** (future): Uploads video file → object storage
4. **Submit**: `POST /api/exercises` → validated with Zod → saved to database
5. **Exercise Created**: Custom exercise appears in organization's library
6. **Isolation**: Only visible to coaches/athletes in same organization

### Flow 4: Assign Program to Athlete

1. **Create Program**: Coach creates program with sessions and exercises
2. **Select Athlete**: Coach browses athletes in organization
3. **Assign**: `POST /api/athlete-programs` with athleteId, programId, startDate
4. **Notification** (future): Athlete receives notification of assignment
5. **Athlete View**: Athlete sees program in dashboard → can view sessions
6. **Log Workout**: Athlete completes session → logs sets, reps, RPE
7. **Track Progress**: Coach views athlete's workout logs and progress

### Flow 5: Trial Expiration & Upgrade

1. **Trial Countdown**: User sees "X days remaining" in dashboard
2. **Trial Expires**: `organization.trialEndsAt` passes → subscriptionStatus unchanged
3. **Access Blocked**: Middleware checks `trialEndsAt` → returns 403
4. **Upgrade Prompt**: Frontend redirects to `/upgrade` page
5. **Payment**: User enters payment method → Stripe processes
6. **Subscription Active**: `subscriptionStatus` updated to "active"
7. **Access Restored**: User can access all features again

---

## 8. SECURITY & PERMISSIONS

### Authentication
- **Method**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions (secure, persistent)
- **CSRF Protection**: Same-site cookies, session validation
- **Password Handling**: Managed by Replit (no local password storage)

### Authorization (Role-Based Access Control)

**Roles**:
- `admin` - Organization owner, full access
- `coach` - Create programs, assign athletes, view organization data
- `athlete` - View assigned programs, log workouts

**Middleware**:
```typescript
isAuthenticated → Checks session validity
requireValidSubscription → Verifies organization trial/active status
```

**Protected Routes**:
- `POST /api/exercises` - Coach/Admin only
- `POST /api/programs` - Coach/Admin only
- `GET /api/exercises` - Subscription required (trial/active)
- `GET /api/auth/user` - Authenticated users only

### Data Isolation
- **Organization Scoping**: All queries filter by `organizationId`
- **Custom Exercises**: Isolated per organization
- **Programs**: Only visible to organization members
- **Athlete Data**: Coaches can only access athletes in their organization

---

## 9. ENVIRONMENT VARIABLES

### Required
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `STRIPE_SECRET_KEY` - Stripe API key (backend)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (frontend)

### Replit-Provided
- `REPL_ID` - Replit deployment ID
- `REPLIT_DEPLOYMENT` - Environment (development/production)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database credentials

### Object Storage (Auto-configured)
- `PUBLIC_OBJECT_SEARCH_PATHS` - Public asset directories
- `PRIVATE_OBJECT_DIR` - Private object directory

---

## 10. BUILD & DEPLOYMENT

### Development
```bash
npm run dev
→ NODE_ENV=development tsx server/index.ts
→ Express server on port 5000
→ Vite dev server (HMR) proxied through Express
→ Database migrations auto-applied
```

### Production Build
```bash
npm run build
→ vite build (client → dist/public)
→ esbuild server/index.ts (server → dist/index.js)

npm run start
→ NODE_ENV=production node dist/index.js
→ Express serves static files from dist/public
```

### Database Migrations
```bash
npm run db:push
→ drizzle-kit push
→ Syncs shared/schema.ts to PostgreSQL
→ Safe schema updates (adds columns, tables)
```

---

## 11. KNOWN ISSUES & TECHNICAL DEBT

### Current Issues

1. **FFmpeg Thumbnail Generation** 
   - **Status**: Not working
   - **Workaround**: SVG placeholders
   - **Root Cause**: fluent-ffmpeg binary not available in Replit environment
   - **Solution Needed**: Pre-generate thumbnails or use cloud thumbnail service

2. **Video Upload for Custom Exercises**
   - **Status**: Backend route exists, frontend UI incomplete
   - **Blocker**: Need to implement Uppy.js file upload integration

3. **Stripe Webhook Handling**
   - **Status**: Not implemented
   - **Risk**: Subscription status not updated automatically
   - **Needed**: Webhook endpoint for subscription events (trial_end, payment_failed, canceled)

### Technical Debt

1. **Storage Layer Abstraction**
   - Currently tight coupling between routes and storage
   - Should add service layer for business logic

2. **Error Handling**
   - Generic error responses in many routes
   - Need structured error codes for frontend handling

3. **Type Safety**
   - Some `any` types in Express request handlers
   - Should use typed request/response interfaces

4. **Testing**
   - No automated tests
   - Need unit tests for business logic, integration tests for API

5. **Performance**
   - No caching layer for exercise queries
   - Consider Redis for frequently accessed data

---

## 12. FUTURE ROADMAP

### Short Term (1-2 months)
- [ ] Fix FFmpeg thumbnail generation or migrate to cloud service
- [ ] Complete video upload UI for custom exercises
- [ ] Implement Stripe webhook handlers
- [ ] Add program assignment UI for coaches
- [ ] Build athlete workout logging interface

### Medium Term (3-6 months)
- [ ] Analytics dashboard (workout completion rates, athlete progress)
- [ ] Team/organization management UI
- [ ] Advanced program templates (9/12/16 week progressions)
- [ ] Exercise video library expansion (100+ videos)
- [ ] Mobile-responsive optimizations

### Long Term (6-12 months)
- [ ] Mobile app (React Native or Progressive Web App)
- [ ] Real-time workout tracking with coach oversight
- [ ] AI-powered exercise recommendations
- [ ] Integration with wearables (heart rate, GPS data)
- [ ] White-label solution for enterprise clients

---

## 13. DEVELOPMENT TEAM NOTES

### Code Conventions
- **TypeScript**: Strict mode enabled, no implicit any
- **Imports**: Use `@` aliases for cleaner imports (`@/components`, `@shared/schema`)
- **Styling**: Tailwind utility classes, shadcn components
- **State Management**: React Query for server state, local useState for UI state
- **Forms**: React Hook Form + Zod schemas from shared/schema.ts

### Key Files to Understand
1. `shared/schema.ts` - Single source of truth for data models
2. `server/routes.ts` - All API endpoints and business logic
3. `server/storage.ts` - Database abstraction layer
4. `client/src/App.tsx` - Route configuration and auth guards
5. `client/src/pages/exercise-library-new.tsx` - Main exercise browsing UI

### Common Patterns
- **Data Fetching**: `useQuery({ queryKey: ['/api/exercises'] })`
- **Mutations**: `useMutation({ mutationFn: (data) => apiRequest(...) })`
- **Auth Check**: `const { data: user } = useQuery({ queryKey: ['/api/auth/user'] })`
- **Subscription Gate**: `requireValidSubscription` middleware on protected routes

---

## APPENDIX: Sample Data Structures

### Sample Exercise Object
```json
{
  "id": 1,
  "name": "Split Jump w/ Exchange",
  "description": "Explosive plyometric exercise...",
  "category": "Plyometric",
  "component": "acceleration",
  "beltLevel": "white",
  "duration": "3x8 reps",
  "equipment": "None",
  "coachingCues": [
    "Land softly on forefoot",
    "Maintain upright torso",
    "Drive knees high"
  ],
  "videoUrl": "/objects/Videos/Videos/Starting - white belt/Split jump w exchange_.MOV",
  "thumbnailUrl": "/api/thumbnails/1",
  "skillFocus": ["power", "coordination"],
  "progressionLevel": 2,
  "complexityRating": 2,
  "isCustom": false,
  "createdAt": "2025-01-20T10:30:00Z"
}
```

### Sample Program Structure
```json
{
  "id": 5,
  "name": "12-Week Field Sports Foundation",
  "programType": "foundation",
  "totalWeeks": 12,
  "sessionsPerWeek": 3,
  "targetPopulation": ["field-sports"],
  "skillEmphasis": ["strength", "power", "stability"],
  "difficultyLevel": "beginner",
  "sessions": [
    {
      "id": 15,
      "name": "Week 1 - Session A",
      "sessionOrder": 1,
      "exercises": [
        {
          "exerciseId": 1,
          "sets": 3,
          "reps": "8",
          "weight": "bodyweight",
          "rest": "60s",
          "exerciseOrder": 1
        }
      ]
    }
  ]
}
```

---

**End of Documentation**

*Last Updated: October 8, 2025*  
*Platform Version: MVP 1.0*  
*Maintained by: Motion Code Development Team*
