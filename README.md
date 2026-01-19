# Fit-Life - AI-Powered Fitness Tracking App

A modern, voice-controlled fitness tracking application built with React, Express, and OpenAI. Track your workouts hands-free, monitor your weight progress, and achieve your fitness goals with intelligent calorie calculations.

## Features

### Voice-Controlled Workout Logging
- Hands-free exercise input using OpenAI Whisper for speech-to-text transcription
- AI-powered natural language parsing with GPT-4o-mini to structure workout data
- Support for clarification questions when input is ambiguous
- Raw voice input tracking with manual edit capability

### Comprehensive Fitness Tracking
- **Weight Tracking**: Daily weight logs with 7-day trend visualization
- **Calorie Management**: Automatic BMR and TDEE calculations based on user metrics
- **Workout Sessions**: Organize exercises into sessions with start/end times
- **Exercise Database**: Autocomplete suggestions based on usage history
- **Analytics Dashboard**: Visual trends for weight and calorie data

### Modern Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **UI Components**: Radix UI with TailwindCSS 4
- **Backend**: Express.js 5 + PostgreSQL + Drizzle ORM
- **AI Integration**: OpenAI API (Whisper + GPT-4o-mini)
- **Charts**: Recharts for data visualization
- **State Management**: React Query for smart caching

## Project Structure

```
Fit-life/
├── client/              # React frontend application
│   ├── src/
│   │   ├── pages/       # Route pages (Dashboard, Workout, History, Profile)
│   │   ├── components/  # Reusable UI components
│   │   ├── lib/         # API client and utilities
│   │   └── hooks/       # Custom React hooks
│   └── public/          # Static assets
├── server/              # Express backend API
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database access layer
│   ├── lib/             # Business logic (AI, calculations)
│   └── index.ts         # Server initialization
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema (Drizzle + Zod)
└── script/              # Build scripts
```

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Fit-life
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/fitlife
   OPENAI_API_KEY=sk-your-openai-api-key-here
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=your-secure-session-secret
   ```

   **Required variables:**
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: OpenAI API key for voice features (get from https://platform.openai.com/)
   - `SESSION_SECRET`: Random string for session encryption

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

   This will create all necessary tables in your PostgreSQL database.

## Running the Application

### Development Mode

**Option 1: Run frontend and backend separately**
```bash
# Terminal 1 - Backend server (runs on port 5000)
npm run dev

# Terminal 2 - Frontend dev server (Vite)
npm run dev:client
```

**Option 2: Run full-stack build**
```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000`

### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend server in development mode |
| `npm run dev:client` | Start Vite frontend dev server on port 5000 |
| `npm run build` | Build frontend and backend for production |
| `npm start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push database schema changes to PostgreSQL |

## Database Schema

The application uses the following main tables:

- **users**: User profiles with fitness metrics (age, height, weight, activity level, goals)
- **weight_logs**: Daily weight tracking with timestamps and notes
- **workout_sessions**: Workout sessions with name, location, and duration
- **exercises**: Individual exercises with reps, sets, weight, and AI parsing metadata
- **exercise_names**: Exercise autocomplete database with usage tracking

## API Endpoints

### Profile Management
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile settings

### Weight Tracking
- `POST /api/weight` - Log daily weight
- `GET /api/weight?days=30` - Get weight history

### Workout Sessions
- `POST /api/sessions` - Create new workout session
- `GET /api/sessions/today` - Get today's session
- `GET /api/sessions?from=&to=` - Get sessions by date range
- `PATCH /api/sessions/:id` - Update session details

### Exercises
- `POST /api/exercises` - Add exercise to session
- `PATCH /api/exercises/:id` - Edit exercise
- `DELETE /api/exercises/:id` - Delete exercise
- `GET /api/exercises/names` - Get autocomplete suggestions

### Voice AI
- `POST /api/voice/transcribe` - Transcribe audio to text (Whisper)
- `POST /api/voice/parse` - Parse text to exercise data (GPT-4o-mini)
- `POST /api/voice/clarify` - Generate clarification questions

### Analytics
- `GET /api/analytics/summary` - Get weight trends and calorie data

## Key Features Explained

### Voice Input Workflow
1. User records audio via MicButton component
2. Audio sent to `/api/voice/transcribe` (OpenAI Whisper)
3. Transcribed text sent to `/api/voice/parse` (GPT-4o-mini)
4. AI returns structured exercise data with confidence level
5. If confidence is low, clarification questions are generated
6. Structured data is saved to the database

### Calorie Calculations
- **BMR (Basal Metabolic Rate)**: Calculated using Mifflin-St Jeor equation
- **TDEE (Total Daily Energy Expenditure)**: BMR × activity level multiplier
- **Target Calories**: Adjusted based on weekly weight loss/gain goals
- **Workout Calories**: Estimated based on session duration and body weight

### Activity Levels
- **Sedentary**: Little or no exercise (1.2x multiplier)
- **Lightly Active**: Light exercise 1-3 days/week (1.375x)
- **Moderately Active**: Moderate exercise 3-5 days/week (1.55x)
- **Very Active**: Hard exercise 6-7 days/week (1.725x)
- **Extra Active**: Very hard exercise & physical job (1.9x)

## Technology Stack Details

### Frontend Dependencies
- **React 19**: Latest React with improved performance
- **TypeScript**: Type-safe development
- **Vite 7**: Fast build tool and dev server
- **TailwindCSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **React Query**: Data fetching and caching
- **Wouter**: Lightweight routing (3KB)
- **Recharts**: Chart visualization library
- **React Hook Form**: Performant form validation
- **Framer Motion**: Animation library

### Backend Dependencies
- **Express.js 5**: Web framework
- **PostgreSQL**: Relational database
- **Drizzle ORM**: Type-safe database toolkit
- **Zod**: Schema validation
- **OpenAI**: AI integration for voice features
- **Multer**: File upload middleware
- **Express Session**: Session management

## Common Issues & Troubleshooting

### Database Connection Errors
- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure database exists: `createdb fitlife`

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has credits: https://platform.openai.com/usage
- Ensure you have access to Whisper and GPT-4o-mini models

### Port Already in Use
- Change `PORT` in `.env` file
- Kill existing process: `lsof -ti:5000 | xargs kill`

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Run type check: `npm run check`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with** by the Fit-Life team using modern web technologies and AI.
