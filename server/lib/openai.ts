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
