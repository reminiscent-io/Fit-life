import { db } from "./db";
import { 
  users, weightLogs, workoutSessions, exercises, exerciseNames,
  type User, type InsertUser,
  type WeightLog, type InsertWeightLog,
  type WorkoutSession, type InsertWorkoutSession,
  type Exercise, type InsertExercise,
  type ExerciseName
} from "@shared/schema";
import { eq, desc, and, sql, gte } from "drizzle-orm";

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
  
  // Exercises
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercisesBySession(sessionId: number): Promise<Exercise[]>;
  updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;
  
  // Exercise Names (autocomplete)
  getExerciseNames(): Promise<ExerciseName[]>;
  upsertExerciseName(name: string): Promise<void>;
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
    let query = db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId));
    
    if (fromDate && toDate) {
      query = query.where(and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.date, fromDate),
        sql`${workoutSessions.date} <= ${toDate}`
      ));
    }
    
    return query.orderBy(desc(workoutSessions.date));
  }

  async updateWorkoutSession(id: number, data: Partial<WorkoutSession>): Promise<WorkoutSession | undefined> {
    const [session] = await db.update(workoutSessions).set(data).where(eq(workoutSessions.id, id)).returning();
    return session;
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
}

export const storage = new DatabaseStorage();
