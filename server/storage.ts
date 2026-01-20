import { db } from "./db";
import {
  users, weightLogs, workoutSessions, exercises, exerciseNames, cardioSessions,
  type User, type InsertUser,
  type WeightLog, type InsertWeightLog,
  type WorkoutSession, type InsertWorkoutSession,
  type Exercise, type InsertExercise,
  type ExerciseName,
  type CardioSession, type InsertCardioSession
} from "@shared/schema";
import { eq, desc, and, sql, gte, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Weight Logs
  createWeightLog(log: InsertWeightLog): Promise<WeightLog>;
  getWeightLogs(userId: number, days?: number): Promise<WeightLog[]>;
  
  // Workout Sessions
  createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession>;
  getWorkoutSession(id: number): Promise<WorkoutSession | undefined>;
  getTodaySession(userId: number): Promise<WorkoutSession | undefined>;
  getWorkoutSessions(userId: number, fromDate?: string, toDate?: string): Promise<WorkoutSession[]>;
  updateWorkoutSession(id: number, data: Partial<WorkoutSession>): Promise<WorkoutSession | undefined>;
  deleteWorkoutSession(id: number): Promise<void>;

  // Exercises
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercisesBySession(sessionId: number): Promise<Exercise[]>;
  updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;
  
  // Exercise Names (autocomplete)
  getExerciseNames(): Promise<ExerciseName[]>;
  upsertExerciseName(name: string): Promise<void>;

  // Cardio Sessions
  createCardioSession(cardio: InsertCardioSession): Promise<CardioSession>;
  getCardioBySession(sessionId: number): Promise<CardioSession[]>;
  getCardioByUser(userId: number): Promise<CardioSession[]>;
  updateCardioSession(id: number, data: Partial<CardioSession>): Promise<CardioSession | undefined>;
  deleteCardioSession(id: number): Promise<void>;

  // Analytics
  getWorkoutCount(userId: number): Promise<number>;
  getExerciseHistory(userId: number, exerciseName: string): Promise<{ date: string; reps: number; weight: number | null; sets: number }[]>;
  getUniqueExerciseNames(userId: number): Promise<string[]>;
  getCardioSummary(userId: number, activityType?: string): Promise<{ activityType: string; totalMinutes: number; totalSessions: number }[]>;

  // Comprehensive data for AI analytics
  getComprehensiveUserData(userId: number): Promise<{
    workouts: Array<{
      date: string;
      name: string | null;
      exercises: Array<{
        exerciseName: string;
        sets: number;
        reps: number;
        weight: number | null;
        weightUnit: string | null;
      }>;
      cardio: Array<{
        activityType: string;
        durationMinutes: number;
        distanceKm: number | null;
        caloriesBurned: number | null;
      }>;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  // Weight Logs
  async createWeightLog(log: InsertWeightLog): Promise<WeightLog> {
    const [weightLog] = await db.insert(weightLogs).values(log).returning();
    return weightLog;
  }

  async getWeightLogs(userId: number, days?: number): Promise<WeightLog[]> {
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return db.select()
        .from(weightLogs)
        .where(and(
          eq(weightLogs.userId, userId),
          gte(weightLogs.date, cutoffDate.toISOString().split('T')[0])
        ))
        .orderBy(desc(weightLogs.date));
    }
    return db.select().from(weightLogs).where(eq(weightLogs.userId, userId)).orderBy(desc(weightLogs.date));
  }

  // Workout Sessions
  async createWorkoutSession(session: InsertWorkoutSession): Promise<WorkoutSession> {
    const [workoutSession] = await db.insert(workoutSessions).values(session).returning();
    return workoutSession;
  }

  async getWorkoutSession(id: number): Promise<WorkoutSession | undefined> {
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
    return session;
  }

  async getTodaySession(userId: number): Promise<WorkoutSession | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [session] = await db.select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.date, today)
      ))
      .orderBy(desc(workoutSessions.createdAt))
      .limit(1);
    return session;
  }

  async getWorkoutSessions(userId: number, fromDate?: string, toDate?: string): Promise<WorkoutSession[]> {
    if (fromDate && toDate) {
      return db.select()
        .from(workoutSessions)
        .where(and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.date, fromDate),
          sql`${workoutSessions.date} <= ${toDate}`
        ))
        .orderBy(desc(workoutSessions.date));
    }

    return db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.date));
  }

  async updateWorkoutSession(id: number, data: Partial<WorkoutSession>): Promise<WorkoutSession | undefined> {
    const [session] = await db.update(workoutSessions).set(data).where(eq(workoutSessions.id, id)).returning();
    return session;
  }

  async deleteWorkoutSession(id: number): Promise<void> {
    // Delete associated exercises and cardio sessions first
    await db.delete(exercises).where(eq(exercises.sessionId, id));
    await db.delete(cardioSessions).where(eq(cardioSessions.sessionId, id));
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
  }

  // Exercises
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [ex] = await db.insert(exercises).values(exercise).returning();
    
    // Update exercise name usage
    if (exercise.exerciseName) {
      await this.upsertExerciseName(exercise.exerciseName);
    }
    
    return ex;
  }

  async getExercisesBySession(sessionId: number): Promise<Exercise[]> {
    return db.select().from(exercises).where(eq(exercises.sessionId, sessionId));
  }

  async updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise | undefined> {
    const [exercise] = await db.update(exercises).set(data).where(eq(exercises.id, id)).returning();
    return exercise;
  }

  async deleteExercise(id: number): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // Exercise Names
  async getExerciseNames(): Promise<ExerciseName[]> {
    return db.select().from(exerciseNames).orderBy(desc(exerciseNames.usageCount)).limit(50);
  }

  async upsertExerciseName(name: string): Promise<void> {
    await db.insert(exerciseNames)
      .values({ name, usageCount: 1, lastUsed: new Date() })
      .onConflictDoUpdate({
        target: exerciseNames.name,
        set: {
          usageCount: sql`${exerciseNames.usageCount} + 1`,
          lastUsed: new Date()
        }
      });
  }

  // Cardio Sessions
  async createCardioSession(cardio: InsertCardioSession): Promise<CardioSession> {
    const [session] = await db.insert(cardioSessions).values(cardio).returning();
    return session;
  }

  async getCardioBySession(sessionId: number): Promise<CardioSession[]> {
    return db.select().from(cardioSessions).where(eq(cardioSessions.sessionId, sessionId));
  }

  async getCardioByUser(userId: number): Promise<CardioSession[]> {
    return db.select({
      id: cardioSessions.id,
      sessionId: cardioSessions.sessionId,
      activityType: cardioSessions.activityType,
      durationMinutes: cardioSessions.durationMinutes,
      distanceKm: cardioSessions.distanceKm,
      caloriesBurned: cardioSessions.caloriesBurned,
      notes: cardioSessions.notes,
      createdAt: cardioSessions.createdAt,
    })
      .from(cardioSessions)
      .innerJoin(workoutSessions, eq(cardioSessions.sessionId, workoutSessions.id))
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(cardioSessions.createdAt));
  }

  async updateCardioSession(id: number, data: Partial<CardioSession>): Promise<CardioSession | undefined> {
    const [session] = await db.update(cardioSessions).set(data).where(eq(cardioSessions.id, id)).returning();
    return session;
  }

  async deleteCardioSession(id: number): Promise<void> {
    await db.delete(cardioSessions).where(eq(cardioSessions.id, id));
  }

  // Analytics
  async getWorkoutCount(userId: number): Promise<number> {
    const result = await db.select({ count: count() })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId));
    return result[0]?.count || 0;
  }

  async getExerciseHistory(userId: number, exerciseName: string): Promise<{ date: string; reps: number; weight: number | null; sets: number }[]> {
    const results = await db.select({
      date: workoutSessions.date,
      reps: exercises.reps,
      weight: exercises.weight,
      sets: exercises.sets,
    })
      .from(exercises)
      .innerJoin(workoutSessions, eq(exercises.sessionId, workoutSessions.id))
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(exercises.exerciseName, exerciseName)
      ))
      .orderBy(desc(workoutSessions.date));
    return results;
  }

  async getUniqueExerciseNames(userId: number): Promise<string[]> {
    const results = await db.selectDistinct({ name: exercises.exerciseName })
      .from(exercises)
      .innerJoin(workoutSessions, eq(exercises.sessionId, workoutSessions.id))
      .where(eq(workoutSessions.userId, userId))
      .orderBy(exercises.exerciseName);
    return results.map(r => r.name);
  }

  async getCardioSummary(userId: number, activityType?: string): Promise<{ activityType: string; totalMinutes: number; totalSessions: number }[]> {
    let query = db.select({
      activityType: cardioSessions.activityType,
      totalMinutes: sql<number>`sum(${cardioSessions.durationMinutes})`.as('totalMinutes'),
      totalSessions: count().as('totalSessions'),
    })
      .from(cardioSessions)
      .innerJoin(workoutSessions, eq(cardioSessions.sessionId, workoutSessions.id))
      .where(eq(workoutSessions.userId, userId))
      .groupBy(cardioSessions.activityType);

    if (activityType) {
      query = db.select({
        activityType: cardioSessions.activityType,
        totalMinutes: sql<number>`sum(${cardioSessions.durationMinutes})`.as('totalMinutes'),
        totalSessions: count().as('totalSessions'),
      })
        .from(cardioSessions)
        .innerJoin(workoutSessions, eq(cardioSessions.sessionId, workoutSessions.id))
        .where(and(
          eq(workoutSessions.userId, userId),
          eq(cardioSessions.activityType, activityType)
        ))
        .groupBy(cardioSessions.activityType);
    }

    return query;
  }

  // Comprehensive data for AI analytics
  async getComprehensiveUserData(userId: number): Promise<{
    workouts: Array<{
      date: string;
      name: string | null;
      exercises: Array<{
        exerciseName: string;
        sets: number;
        reps: number;
        weight: number | null;
        weightUnit: string | null;
      }>;
      cardio: Array<{
        activityType: string;
        durationMinutes: number;
        distanceKm: number | null;
        caloriesBurned: number | null;
      }>;
    }>;
  }> {
    // Get all workout sessions for the user
    const sessions = await db.select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.date));

    // For each session, get exercises and cardio
    const workouts = await Promise.all(
      sessions.map(async (session) => {
        const sessionExercises = await db.select({
          exerciseName: exercises.exerciseName,
          sets: exercises.sets,
          reps: exercises.reps,
          weight: exercises.weight,
          weightUnit: exercises.weightUnit,
        })
          .from(exercises)
          .where(eq(exercises.sessionId, session.id));

        const sessionCardio = await db.select({
          activityType: cardioSessions.activityType,
          durationMinutes: cardioSessions.durationMinutes,
          distanceKm: cardioSessions.distanceKm,
          caloriesBurned: cardioSessions.caloriesBurned,
        })
          .from(cardioSessions)
          .where(eq(cardioSessions.sessionId, session.id));

        return {
          date: session.date,
          name: session.name,
          exercises: sessionExercises,
          cardio: sessionCardio,
        };
      })
    );

    return { workouts };
  }
}

export const storage = new DatabaseStorage();
