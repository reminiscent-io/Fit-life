// API client for VoiceFit backend

export interface ParsedExercise {
  exercise: string;
  reps: number;
  sets: number;
  weight?: number;
  unit: string;
  confidence: "high" | "medium" | "low";
  missing?: string[];
}

export interface Exercise {
  id: number;
  sessionId: number;
  exerciseName: string;
  reps: number;
  sets: number;
  weight: number | null;
  weightUnit: string;
  rawVoiceInput: string | null;
  manuallyEdited: boolean;
  createdAt: string;
}

export interface WorkoutSession {
  id: number;
  userId: number;
  date: string;
  name: string | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  exercises?: Exercise[];
}

export interface WeightLog {
  id: number;
  userId: number;
  date: string;
  weight: number;
  timeOfDay: string | null;
  notes: string | null;
}

export interface AnalyticsSummary {
  weight: {
    current: number;
    sevenDayAvg: number;
    target: number | null;
  };
  calories: {
    base: number;
    workout: number;
    target: number;
  };
}

export interface CardioSession {
  id: number;
  sessionId: number;
  activityType: string;
  durationMinutes: number;
  distanceKm: number | null;
  caloriesBurned: number | null;
  notes: string | null;
  createdAt: string;
}

export interface ExerciseHistoryPoint {
  date: string;
  reps: number;
  weight: number | null;
  sets: number;
}

export interface CardioSummary {
  activityType: string;
  totalMinutes: number;
  totalSessions: number;
}

export interface AiInsight {
  answer: string;
  recommendations?: string[];
  suggestedWorkout?: {
    name: string;
    exercises: Array<{
      exerciseName: string;
      sets: number;
      reps: number;
      weight?: number;
      notes?: string;
    }>;
  };
}

class API {
  private baseURL = "/api";

  // Voice endpoints
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const res = await fetch(`${this.baseURL}/voice/transcribe`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Transcription failed");
    const data = await res.json();
    return data.text;
  }

  async parseWorkout(text: string): Promise<ParsedExercise> {
    const res = await fetch(`${this.baseURL}/voice/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error("Parsing failed");
    return res.json();
  }

  // Exercise endpoints
  async createExercise(data: {
    sessionId: number;
    exerciseName: string;
    reps: number;
    sets: number;
    weight?: number;
    weightUnit?: string;
    rawVoiceInput?: string;
  }): Promise<Exercise> {
    const res = await fetch(`${this.baseURL}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create exercise");
    return res.json();
  }

  async updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise> {
    const res = await fetch(`${this.baseURL}/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update exercise");
    return res.json();
  }

  async deleteExercise(id: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/exercises/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete exercise");
  }

  // Session endpoints
  async createSession(data?: {
    name?: string;
    location?: string;
  }): Promise<WorkoutSession> {
    const res = await fetch(`${this.baseURL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });

    if (!res.ok) throw new Error("Failed to create session");
    return res.json();
  }

  async getTodaySession(): Promise<WorkoutSession | null> {
    const res = await fetch(`${this.baseURL}/sessions/today`);
    
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to get today's session");
    return res.json();
  }

  async getSessions(fromDate?: string, toDate?: string): Promise<WorkoutSession[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);

    const res = await fetch(`${this.baseURL}/sessions?${params}`);
    if (!res.ok) throw new Error("Failed to get sessions");
    return res.json();
  }

  async updateSession(id: number, data: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const res = await fetch(`${this.baseURL}/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update session");
    return res.json();
  }

  async deleteSession(id: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/sessions/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete session");
  }

  // Weight endpoints
  async createWeightLog(data: {
    date: string;
    weight: number;
    timeOfDay?: string;
    notes?: string;
  }): Promise<WeightLog> {
    const res = await fetch(`${this.baseURL}/weight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create weight log");
    return res.json();
  }

  async getWeightLogs(days?: number): Promise<WeightLog[]> {
    const params = days ? `?days=${days}` : "";
    const res = await fetch(`${this.baseURL}/weight${params}`);
    
    if (!res.ok) throw new Error("Failed to get weight logs");
    return res.json();
  }

  // Analytics
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${this.baseURL}/analytics/summary`);
    if (!res.ok) throw new Error("Failed to get analytics");
    return res.json();
  }

  // Profile
  async getProfile() {
    const res = await fetch(`${this.baseURL}/profile`);
    if (!res.ok) throw new Error("Failed to get profile");
    return res.json();
  }

  async updateProfile(data: any) {
    const res = await fetch(`${this.baseURL}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  }

  // Exercise names for quick-add
  async getExerciseNames(): Promise<{ name: string; usageCount: number }[]> {
    const res = await fetch(`${this.baseURL}/exercises/names`);
    if (!res.ok) throw new Error("Failed to get exercise names");
    return res.json();
  }

  // Analytics - workout count
  async getWorkoutCount(): Promise<{ count: number }> {
    const res = await fetch(`${this.baseURL}/analytics/workout-count`);
    if (!res.ok) throw new Error("Failed to get workout count");
    return res.json();
  }

  // Analytics - exercise history for scatter chart
  async getExerciseHistory(exerciseName: string): Promise<ExerciseHistoryPoint[]> {
    const res = await fetch(`${this.baseURL}/analytics/exercise-history/${encodeURIComponent(exerciseName)}`);
    if (!res.ok) throw new Error("Failed to get exercise history");
    return res.json();
  }

  // Analytics - unique exercise names for dropdown
  async getUniqueExerciseNames(): Promise<string[]> {
    const res = await fetch(`${this.baseURL}/analytics/exercise-names`);
    if (!res.ok) throw new Error("Failed to get exercise names");
    return res.json();
  }

  // Analytics - cardio summary
  async getCardioSummary(activityType?: string): Promise<CardioSummary[]> {
    const params = activityType ? `?type=${encodeURIComponent(activityType)}` : "";
    const res = await fetch(`${this.baseURL}/analytics/cardio-summary${params}`);
    if (!res.ok) throw new Error("Failed to get cardio summary");
    return res.json();
  }

  // Cardio session endpoints
  async createCardioSession(data: {
    sessionId: number;
    activityType: string;
    durationMinutes: number;
    distanceKm?: number;
    caloriesBurned?: number;
    notes?: string;
  }): Promise<CardioSession> {
    const res = await fetch(`${this.baseURL}/cardio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create cardio session");
    return res.json();
  }

  async getCardioSessions(): Promise<CardioSession[]> {
    const res = await fetch(`${this.baseURL}/cardio`);
    if (!res.ok) throw new Error("Failed to get cardio sessions");
    return res.json();
  }

  async getCardioBySession(sessionId: number): Promise<CardioSession[]> {
    const res = await fetch(`${this.baseURL}/cardio/session/${sessionId}`);
    if (!res.ok) throw new Error("Failed to get cardio for session");
    return res.json();
  }

  async updateCardioSession(id: number, data: Partial<CardioSession>): Promise<CardioSession> {
    const res = await fetch(`${this.baseURL}/cardio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update cardio session");
    return res.json();
  }

  async deleteCardioSession(id: number): Promise<void> {
    const res = await fetch(`${this.baseURL}/cardio/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete cardio session");
  }

  // AI Fitness Coach
  async askAiCoach(question: string): Promise<AiInsight> {
    const res = await fetch(`${this.baseURL}/analytics/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) throw new Error("Failed to get AI insights");
    return res.json();
  }
}

export const api = new API();
