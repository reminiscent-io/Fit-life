import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, real, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  age: integer("age"),
  heightCm: real("height_cm"),
  sex: text("sex"),
  activityLevel: text("activity_level"),
  targetWeight: real("target_weight"),
  weeklyGoal: real("weekly_goal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weight: real("weight").notNull(),
  timeOfDay: text("time_of_day"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type WeightLog = typeof weightLogs.$inferSelect;

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  name: text("name"),
  location: text("location"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkoutSessionSchema = createInsertSchema(workoutSessions).omit({
  id: true,
  createdAt: true,
});
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessions.$inferSelect;

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseName: text("exercise_name").notNull(),
  reps: integer("reps").notNull(),
  sets: integer("sets").notNull().default(1),
  weight: real("weight"),
  weightUnit: text("weight_unit").default("lbs"),
  rawVoiceInput: text("raw_voice_input"),
  manuallyEdited: boolean("manually_edited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

export const exerciseNames = pgTable("exercise_names", {
  name: text("name").primaryKey(),
  usageCount: integer("usage_count").default(1).notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
});

export const insertExerciseNameSchema = createInsertSchema(exerciseNames);
export type InsertExerciseName = z.infer<typeof insertExerciseNameSchema>;
export type ExerciseName = typeof exerciseNames.$inferSelect;

export const cardioSessions = pgTable("cardio_sessions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(), // "running", "rowing", "cycling", etc.
  durationMinutes: real("duration_minutes").notNull(),
  distanceKm: real("distance_km"),
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCardioSessionSchema = createInsertSchema(cardioSessions).omit({
  id: true,
  createdAt: true,
});
export type InsertCardioSession = z.infer<typeof insertCardioSessionSchema>;
export type CardioSession = typeof cardioSessions.$inferSelect;
