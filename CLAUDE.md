# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

This is a React + Express + PostgreSQL fitness tracking app with OpenAI voice integration.

### Directory Structure

- **client/** - React 19 frontend with Vite
  - `src/pages/` - Route pages (Dashboard, Workout, History, Profile)
  - `src/components/` - UI components (Radix UI primitives in `ui/`)
  - `src/lib/api.ts` - API client class with typed methods
- **server/** - Express 5 backend
  - `routes.ts` - All API endpoint handlers
  - `storage.ts` - Database access layer (implements `IStorage` interface)
  - `lib/openai.ts` - Whisper transcription and GPT parsing
  - `lib/calculations.ts` - BMR/TDEE calorie calculations
- **shared/** - Code shared between client and server
  - `schema.ts` - Drizzle ORM schema with Zod validation (single source of truth for types)

### Path Aliases

```typescript
@/*       → client/src/*
@shared/* → shared/*
@assets   → attached_assets/
```

### Data Flow

1. Frontend uses React Query for data fetching via `client/src/lib/api.ts`
2. API routes in `server/routes.ts` use `ensureUser` middleware (single-user mode with "default" user)
3. Storage layer in `server/storage.ts` uses Drizzle ORM to query PostgreSQL
4. Types are derived from `shared/schema.ts` using Drizzle's `$inferSelect` and Zod's `createInsertSchema`

### Voice Workflow

Audio → `/api/voice/transcribe` (Whisper) → text → `/api/voice/parse` (GPT-4o-mini) → structured exercise data

### Key Technologies

- **Routing**: Wouter (lightweight, 3KB)
- **Styling**: TailwindCSS 4 with Radix UI components
- **State**: React Query (@tanstack/react-query)
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas generated from Drizzle tables

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For voice transcription/parsing
- `SESSION_SECRET` - For session encryption
