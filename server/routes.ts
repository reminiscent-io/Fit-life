import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { transcribeAudio, parseWorkoutText, generateClarificationQuestion } from "./lib/openai";
import { calculateBMR, activityMultipliers, estimateWorkoutCalories, getDailyCalorieTarget, lbsToKg, calculateMovingAverage } from "./lib/calculations";
import { insertWeightLogSchema, insertWorkoutSessionSchema, insertExerciseSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Profile endpoints
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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
  app.post("/api/weight", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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

  app.get("/api/weight", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const logs = await storage.getWeightLogs(req.user.id, days);
    res.json(logs);
  });

  // Workout session endpoints
  app.post("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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

  app.get("/api/sessions/today", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const session = await storage.getTodaySession(req.user.id);
    if (!session) {
      return res.status(404).json({ error: "No session found for today" });
    }
    
    const exercises = await storage.getExercisesBySession(session.id);
    res.json({ ...session, exercises });
  });

  app.get("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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

  app.patch("/api/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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
  app.post("/api/exercises", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const data = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(data);
      res.json(exercise);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/exercises/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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

  app.delete("/api/exercises/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const id = parseInt(req.params.id);
    await storage.deleteExercise(id);
    res.json({ success: true });
  });

  app.get("/api/exercises/names", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const names = await storage.getExerciseNames();
    res.json(names);
  });

  // AI Voice endpoints
  app.post("/api/voice/transcribe", upload.single('audio'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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

  app.post("/api/voice/parse", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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

  app.post("/api/voice/clarify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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
  app.get("/api/analytics/summary", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
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

  return httpServer;
}
