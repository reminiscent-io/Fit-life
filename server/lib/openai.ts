import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY not set. Voice transcription and parsing will fail.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development"
});

export interface ParsedExercise {
  exercise: string;
  reps: number;
  sets: number;
  weight?: number;
  unit: string;
  confidence: "high" | "medium" | "low";
  missing?: string[];
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
  
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
  
  return transcription.text;
}

export async function parseWorkoutText(text: string): Promise<ParsedExercise> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a fitness tracking assistant. Parse workout descriptions into structured JSON.

Extract: exercise name, reps, sets (if mentioned), weight, unit.

Return format:
{
  "exercise": "bench press",
  "reps": 12,
  "sets": 3,
  "weight": 135,
  "unit": "lbs",
  "confidence": "high|medium|low",
  "missing": [] // list missing fields if any
}

If critical data is missing, set confidence to "low" and list missing fields.
Default to "lbs" if no unit specified.
If sets aren't mentioned, default to 1.`
      },
      {
        role: "user",
        content: text
      }
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  return result as ParsedExercise;
}

export async function generateClarificationQuestion(
  rawInput: string,
  missingFields: string[]
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a friendly fitness tracker. Ask ONE clarifying question to complete the workout log. Be conversational and brief."
      },
      {
        role: "user",
        content: `I logged: "${rawInput}". Missing: ${missingFields.join(', ')}. What should I ask?`
      }
    ]
  });

  return completion.choices[0].message.content || "Could you provide more details?";
}

// AI Fitness Analytics Types
export interface UserFitnessContext {
  profile: {
    name: string;
    age?: number;
    heightCm?: number;
    sex?: string;
    activityLevel?: string;
    targetWeight?: number;
    weeklyGoal?: number;
  };
  workouts: Array<{
    date: string;
    name?: string;
    exercises: Array<{
      exerciseName: string;
      sets: number;
      reps: number;
      weight?: number;
      weightUnit?: string;
    }>;
    cardio: Array<{
      activityType: string;
      durationMinutes: number;
      distanceKm?: number;
      caloriesBurned?: number;
    }>;
  }>;
  weightHistory: Array<{
    date: string;
    weight: number;
  }>;
  stats: {
    totalWorkouts: number;
    uniqueExercises: string[];
    cardioSummary: Array<{
      activityType: string;
      totalMinutes: number;
      totalSessions: number;
    }>;
  };
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

export async function analyzeWorkoutData(
  context: UserFitnessContext,
  question: string
): Promise<AiInsight> {
  const systemPrompt = `You are an expert AI fitness coach with deep knowledge of exercise science, progressive overload, and personalized training.
You have access to the user's complete workout history, body metrics, and fitness goals.

Your role is to:
1. Answer their fitness-related questions based on their actual data
2. Identify patterns, progress, and areas needing attention
3. Provide actionable recommendations
4. When appropriate, suggest a specific workout plan that builds on what they're already doing

Guidelines:
- Be encouraging but honest about their progress
- Base recommendations on their actual workout patterns and weights used
- For workout suggestions, make them slightly more challenging than their recent sessions (progressive overload)
- Consider muscle balance - if they've been neglecting certain muscle groups, point it out
- Keep responses conversational but informative
- Use their name when appropriate

The user's data will be provided in JSON format. Analyze it carefully before responding.`;

  const userMessage = `Here is my complete fitness data:

${JSON.stringify(context, null, 2)}

My question: ${question}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7
  });

  const responseText = completion.choices[0].message.content || "{}";

  try {
    const parsed = JSON.parse(responseText);
    return {
      answer: parsed.answer || "I couldn't analyze your data at this time.",
      recommendations: parsed.recommendations,
      suggestedWorkout: parsed.suggestedWorkout
    };
  } catch {
    // If JSON parsing fails, return the raw text as the answer
    return {
      answer: responseText
    };
  }
}
