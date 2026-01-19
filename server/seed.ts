import { storage } from "./storage";

export async function seedData() {
  // Create or get default user
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
      targetWeight: 185,
      weeklyGoal: -0.5
    });
  }

  // Add some weight logs for the past week
  const today = new Date();
  const weights = [193.2, 193.5, 193.8, 194.5, 194.2, 194.8, 195.0];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    try {
      await storage.createWeightLog({
        userId: user.id,
        date: date.toISOString().split('T')[0],
        weight: weights[i],
        timeOfDay: "morning"
      });
    } catch (error) {
      // Skip if already exists
    }
  }

  // Add a past workout session
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  try {
    const session = await storage.createWorkoutSession({
      userId: user.id,
      date: yesterday.toISOString().split('T')[0],
      name: "Upper Body Power",
      location: "Equinox",
      startTime: new Date(yesterday.setHours(18, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(18, 55, 0, 0))
    });

    // Add exercises to the session
    await storage.createExercise({
      sessionId: session.id,
      exerciseName: "Bench Press",
      sets: 4,
      reps: 8,
      weight: 185,
      weightUnit: "lbs"
    });

    await storage.createExercise({
      sessionId: session.id,
      exerciseName: "Pull Ups",
      sets: 3,
      reps: 10,
      weight: 0,
      weightUnit: "lbs"
    });

    await storage.createExercise({
      sessionId: session.id,
      exerciseName: "Shoulder Press",
      sets: 3,
      reps: 12,
      weight: 50,
      weightUnit: "lbs"
    });
  } catch (error) {
    // Skip if already exists
  }

  console.log("✅ Seed data loaded");
}
