import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { transcribeAudio, parseWorkoutText, generateClarificationQuestion } from "./lib/openai";
import { calculateBMR, activityMultipliers, estimateWorkoutCalories, getDailyCalorieTarget, lbsToKg, calculateMovingAverage } from "./lib/calculations";
import { insertWeightLogSchema, insertWorkoutSessionSchema, insertExerciseSchema, insertCardioSessionSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

// Simple middleware to get or create default user
async function ensureUser(req: Request, res: any, next: any) {
  // For this fitness app, we'll use a simple single-user approach
  // Get or create default user
  let user = await storage.getUserByUsername("default");
  
  if (!user) {
    user = await storage.createUser({
      username: "default",
      password: "password",
      name: "Alex",
      age: 28,
      heightCm: 180,
      sex: "male",
      activityLevel: "moderately_active",
      weeklyGoal: -0.5 // lose 0.5 lbs per week
    });
  }
  
  (req as any).user = user;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Apply user middleware to all API routes
  app.use("/api", ensureUser);
  
  // Profile endpoints
  app.get("/api/profile", async (req: any, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/profile", async (req: any, res) => {
    const { name, age, heightCm, sex, activityLevel, targetWeight, weeklyGoal } = req.body;
    
    const user = await storage.updateUser(req.user.id, {
      name,
      age,
      heightCm,
      sex,
      activityLevel,
      targetWeight,
      weeklyGoal
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Weight logging endpoints
  app.post("/api/weight", async (req: any, res) => {
    try {
      const data = insertWeightLogSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const weightLog = await storage.createWeightLog(data);
      res.json(weightLog);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.get("/api/weight", async (req: any, res) => {
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const logs = await storage.getWeightLogs(req.user.id, days);
    res.json(logs);
  });

  // Workout session endpoints
  app.post("/api/sessions", async (req: any, res) => {
    try {
      const data = insertWorkoutSessionSchema.parse({
        ...req.body,
        userId: req.user.id,
        date: req.body.date || new Date().toISOString().split('T')[0],
        startTime: req.body.startTime || new Date()
      });
      
      const session = await storage.createWorkoutSession(data);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.get("/api/sessions/today", async (req: any, res) => {
    const session = await storage.getTodaySession(req.user.id);
    if (!session) {
      return res.status(404).json({ error: "No session found for today" });
    }
    
    const exercises = await storage.getExercisesBySession(session.id);
    res.json({ ...session, exercises });
  });

  app.get("/api/sessions", async (req: any, res) => {
    const fromDate = req.query.from as string | undefined;
    const toDate = req.query.to as string | undefined;
    
    const sessions = await storage.getWorkoutSessions(req.user.id, fromDate, toDate);
    
    // Fetch exercises for each session
    const sessionsWithExercises = await Promise.all(
      sessions.map(async (session) => {
        const exercises = await storage.getExercisesBySession(session.id);
        return { ...session, exercises };
      })
    );
    
    res.json(sessionsWithExercises);
  });

  app.patch("/api/sessions/:id", async (req: any, res) => {
    const id = parseInt(req.params.id);
    const { name, location, endTime } = req.body;
    
    const session = await storage.updateWorkoutSession(id, {
      name,
      location,
      endTime
    });
    
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    res.json(session);
  });

  // Exercise endpoints
  app.post("/api/exercises", async (req: any, res) => {
    try {
      const data = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(data);
      res.json(exercise);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/exercises/:id", async (req: any, res) => {
    const id = parseInt(req.params.id);
    const exercise = await storage.updateExercise(id, {
      ...req.body,
      manuallyEdited: true
    });
    
    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }
    
    res.json(exercise);
  });

  app.delete("/api/exercises/:id", async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteExercise(id);
    res.json({ success: true });
  });

  app.get("/api/exercises/names", async (req: any, res) => {
    const names = await storage.getExerciseNames();
    res.json(names);
  });

  // AI Voice endpoints
  app.post("/api/voice/transcribe", upload.single('audio'), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }
    
    try {
      const transcription = await transcribeAudio(req.file.buffer);
      res.json({ text: transcription });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: error.message || "Transcription failed" });
    }
  });

  app.post("/api/voice/parse", async (req: any, res) => {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }
    
    try {
      const parsed = await parseWorkoutText(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Parsing error:", error);
      res.status(500).json({ error: error.message || "Parsing failed" });
    }
  });

  app.post("/api/voice/clarify", async (req: any, res) => {
    const { rawInput, missingFields } = req.body;
    
    if (!rawInput || !missingFields) {
      return res.status(400).json({ error: "Invalid request" });
    }
    
    try {
      const question = await generateClarificationQuestion(rawInput, missingFields);
      res.json({ question });
    } catch (error: any) {
      console.error("Clarification error:", error);
      res.status(500).json({ error: error.message || "Failed to generate question" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics/summary", async (req: any, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get weight data
    const weightLogs = await storage.getWeightLogs(req.user.id, 30);
    const currentWeight = weightLogs[0]?.weight || user.targetWeight || 0;
    const movingAvg = calculateMovingAverage(weightLogs.map(w => w.weight));

    // Calculate TDEE
    let baseCalories = 2000; // Default
    if (user.age && user.heightCm && currentWeight) {
      const bmr = calculateBMR(lbsToKg(currentWeight), user.heightCm, user.age, user.sex || 'male');
      const multiplier = activityMultipliers[user.activityLevel || 'moderately_active'];
      baseCalories = Math.round(bmr * multiplier);
    }

    // Get today's workout
    const todaySession = await storage.getTodaySession(req.user.id);
    let workoutCalories = 0;

    if (todaySession && todaySession.startTime && todaySession.endTime) {
      const duration = (new Date(todaySession.endTime).getTime() - new Date(todaySession.startTime).getTime()) / 1000 / 60;
      workoutCalories = Math.round(estimateWorkoutCalories(duration, currentWeight));
    }

    const targetCalories = user.weeklyGoal
      ? Math.round(getDailyCalorieTarget(baseCalories, user.weeklyGoal))
      : baseCalories;

    res.json({
      weight: {
        current: currentWeight,
        sevenDayAvg: Math.round(movingAvg * 10) / 10,
        target: user.targetWeight
      },
      calories: {
        base: baseCalories,
        workout: workoutCalories,
        target: targetCalories + workoutCalories
      }
    });
  });

  // Workout count endpoint
  app.get("/api/analytics/workout-count", async (req: any, res) => {
    const count = await storage.getWorkoutCount(req.user.id);
    res.json({ count });
  });

  // Exercise history endpoint (for scatter chart)
  app.get("/api/analytics/exercise-history/:exerciseName", async (req: any, res) => {
    const exerciseName = decodeURIComponent(req.params.exerciseName);
    const history = await storage.getExerciseHistory(req.user.id, exerciseName);
    res.json(history);
  });

  // Get unique exercise names for dropdown
  app.get("/api/analytics/exercise-names", async (req: any, res) => {
    const names = await storage.getUniqueExerciseNames(req.user.id);
    res.json(names);
  });

  // Cardio summary endpoint
  app.get("/api/analytics/cardio-summary", async (req: any, res) => {
    const activityType = req.query.type as string | undefined;
    const summary = await storage.getCardioSummary(req.user.id, activityType);
    res.json(summary);
  });

  // Cardio session endpoints
  app.post("/api/cardio", async (req: any, res) => {
    try {
      const data = insertCardioSessionSchema.parse(req.body);
      const cardio = await storage.createCardioSession(data);
      res.json(cardio);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.get("/api/cardio", async (req: any, res) => {
    const cardioSessions = await storage.getCardioByUser(req.user.id);
    res.json(cardioSessions);
  });

  app.get("/api/cardio/session/:sessionId", async (req: any, res) => {
    const sessionId = parseInt(req.params.sessionId);
    const cardio = await storage.getCardioBySession(sessionId);
    res.json(cardio);
  });

  app.patch("/api/cardio/:id", async (req: any, res) => {
    const id = parseInt(req.params.id);
    const cardio = await storage.updateCardioSession(id, req.body);

    if (!cardio) {
      return res.status(404).json({ error: "Cardio session not found" });
    }

    res.json(cardio);
  });

  app.delete("/api/cardio/:id", async (req: any, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteCardioSession(id);
    res.json({ success: true });
  });

  return httpServer;
}
