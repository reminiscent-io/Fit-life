# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fit-life is a fitness tracking application with voice-powered workout logging and AI coaching capabilities. It combines a React frontend with an Express backend, using PostgreSQL for data persistence and OpenAI APIs for voice transcription and intelligent workout analysis.

## Build & Development Commands

```bash
npm run dev          # Start Express backend server (port 5000)
npm run dev:client   # Start Vite frontend dev server (port 5000)
npm run build        # Build for production (outputs to dist/)
npm start            # Run production server
npm run check        # TypeScript type checking
npm run db:push      # Push Drizzle schema changes to PostgreSQL
```

For development, run backend and frontend in separate terminals. The backend serves API routes and proxies to Vite in dev mode.

## Architecture

### Directory Structure

```
Fit-life/
├── client/                    # React 19 frontend with Vite
│   ├── src/
│   │   ├── pages/             # Route pages
│   │   │   ├── dashboard.tsx  # Home dashboard with analytics
│   │   │   ├── workout.tsx    # Active workout session
│   │   │   ├── history.tsx    # Workout history browser
│   │   │   └── profile.tsx    # User profile settings
│   │   ├── components/
│   │   │   ├── ui/            # Radix UI primitives (shadcn/ui style)
│   │   │   ├── charts/        # Recharts visualizations
│   │   │   │   ├── weight-chart.tsx
│   │   │   │   ├── calorie-display.tsx
│   │   │   │   ├── exercise-scatter-chart.tsx
│   │   │   │   ├── cardio-metrics.tsx
│   │   │   │   └── workout-count.tsx
│   │   │   ├── ai-coach.tsx       # Floating AI assistant
│   │   │   ├── exercise-card.tsx  # Exercise display/edit
│   │   │   ├── layout.tsx         # App shell with navigation
│   │   │   ├── mic-button.tsx     # Voice recording button
│   │   │   └── quick-add-chips.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/
│   │       ├── api.ts         # API client class with typed methods
│   │       ├── queryClient.ts # React Query configuration
│   │       └── utils.ts       # Utility functions (cn, etc.)
│   └── index.html
├── server/                    # Express 5 backend
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # All API endpoint handlers
│   ├── storage.ts             # Database access layer (IStorage interface)
│   ├── db.ts                  # Drizzle database connection
│   ├── vite.ts                # Vite dev server integration
│   ├── static.ts              # Static file serving for production
│   ├── seed.ts                # Database seeding utilities
│   └── lib/
│       ├── openai.ts          # Whisper transcription, GPT parsing, AI coach
│       └── calculations.ts    # BMR/TDEE/calorie calculations
├── shared/                    # Code shared between client and server
│   └── schema.ts              # Drizzle ORM schema with Zod validation
├── script/
│   └── build.ts               # Production build script
├── drizzle.config.ts          # Drizzle Kit configuration
├── vite.config.ts             # Vite configuration
└── tsconfig.json              # TypeScript configuration
```

### Path Aliases

```typescript
@/*       → client/src/*
@shared/* → shared/*
@assets   → attached_assets/
```

### Data Flow

1. **Frontend**: React Query for data fetching via `client/src/lib/api.ts`
2. **Middleware**: Routes use `ensureUser` middleware (single-user mode with "default" user)
3. **Storage**: `server/storage.ts` implements `IStorage` interface using Drizzle ORM
4. **Types**: Derived from `shared/schema.ts` using Drizzle's `$inferSelect` and Zod's `createInsertSchema`

## Database Schema

All tables are defined in `shared/schema.ts`:

| Table | Description |
|-------|-------------|
| `users` | User profiles with fitness goals, body metrics |
| `weight_logs` | Daily weight tracking entries |
| `workout_sessions` | Workout sessions with date, name, location, times |
| `exercises` | Individual exercises (sets, reps, weight) linked to sessions |
| `exercise_names` | Autocomplete suggestions with usage counts |
| `cardio_sessions` | Cardio activities linked to workout sessions |

### Key Relationships
- `workout_sessions` → `users` (user_id, cascade delete)
- `exercises` → `workout_sessions` (session_id, cascade delete)
- `cardio_sessions` → `workout_sessions` (session_id, cascade delete)
- `weight_logs` → `users` (user_id, cascade delete)

## API Endpoints

### Profile
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update user profile

### Weight Tracking
- `POST /api/weight` - Log weight entry
- `GET /api/weight?days=N` - Get weight logs (optional: last N days)

### Workout Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions?from=&to=` - Get sessions (optional date range)
- `GET /api/sessions/today` - Get today's active session
- `PATCH /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Exercises
- `POST /api/exercises` - Create exercise
- `PATCH /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise
- `GET /api/exercises/names` - Get exercise name suggestions

### Cardio
- `POST /api/cardio` - Create cardio entry
- `GET /api/cardio` - Get all cardio sessions
- `GET /api/cardio/session/:sessionId` - Get cardio for session
- `PATCH /api/cardio/:id` - Update cardio
- `DELETE /api/cardio/:id` - Delete cardio

### Voice AI
- `POST /api/voice/transcribe` - Audio → text (Whisper)
- `POST /api/voice/parse` - Text → structured exercise (GPT-4o-mini)
- `POST /api/voice/clarify` - Generate clarification question

### Analytics
- `GET /api/analytics/summary` - TDEE, weight stats, calorie targets
- `GET /api/analytics/workout-count` - Total workouts count
- `GET /api/analytics/exercise-history/:name` - Progress data for exercise
- `GET /api/analytics/exercise-names` - User's unique exercise names
- `GET /api/analytics/cardio-summary` - Cardio aggregates
- `POST /api/analytics/ask` - AI Fitness Coach Q&A (GPT-4o)

## Key Features

### Voice Workout Logging
```
Audio → /api/voice/transcribe (Whisper) → text → /api/voice/parse (GPT-4o-mini) → structured exercise data
```
- Records audio via browser MediaRecorder API
- Transcribes using OpenAI Whisper
- Parses natural language into structured exercise data
- Returns confidence level and missing fields for clarification

### AI Fitness Coach
- Accessible via floating button on all pages (`ai-coach.tsx`)
- Uses GPT-4o with full user context (workouts, weight history, profile)
- Provides personalized recommendations and suggested workouts
- Analyzes progress patterns and identifies imbalances

### Calorie Calculations
Located in `server/lib/calculations.ts`:
- **BMR**: Mifflin-St Jeor equation
- **TDEE**: Activity level multipliers (sedentary → extremely active)
- **Workout calories**: METs-based estimation
- **Daily targets**: Adjusted for weekly weight goals

## Key Technologies

| Category | Technology |
|----------|------------|
| Frontend Framework | React 19 |
| Routing | Wouter (lightweight, 3KB) |
| Styling | TailwindCSS 4 + Radix UI |
| State Management | React Query (@tanstack/react-query) |
| Charts | Recharts |
| Backend | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (generated from Drizzle schemas) |
| AI/Voice | OpenAI (Whisper, GPT-4o-mini, GPT-4o) |
| Build Tool | Vite 7 |

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...    # PostgreSQL connection string
OPENAI_API_KEY=sk-...            # For voice transcription and AI coaching
SESSION_SECRET=...               # For session encryption
```

## Coding Conventions

### TypeScript
- Strict mode enabled
- Types derived from Drizzle schema (single source of truth)
- Use `@shared/*` imports for shared types

### React Components
- Functional components with hooks
- React Query for all data fetching
- Radix UI primitives in `components/ui/`
- Use `cn()` utility for conditional classNames

### API Client
- All API calls go through `client/src/lib/api.ts`
- Returns typed responses matching server schemas
- Throws on non-OK responses

### Database
- Use Drizzle ORM query builder
- All operations go through `IStorage` interface in `storage.ts`
- Zod schemas for request validation

### Styling
- TailwindCSS utility classes
- Responsive: mobile-first with `md:` breakpoints
- Dark mode support via CSS variables
- Mobile bottom nav, desktop side nav

## Navigation Structure

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Weight chart, calorie display, workout stats |
| `/workout` | Workout | Active session with voice logging |
| `/history` | History | Browse past workout sessions |
| `/profile` | Profile | User settings and body metrics |

## Single-User Mode

The app currently operates in single-user mode:
- `ensureUser` middleware creates/retrieves a "default" user
- Default user name is "Kevin" (configurable in `routes.ts`)
- No authentication required for API endpoints
