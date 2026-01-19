// BMR using Mifflin-St Jeor equation
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: string): number {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

// TDEE multipliers
export const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9
};

// Workout calorie estimation (METs-based)
export function estimateWorkoutCalories(
  durationMinutes: number,
  weightLbs: number,
  intensity: 'light' | 'moderate' | 'intense' = 'moderate'
): number {
  const mets = {
    light: 3.5,
    moderate: 5,
    intense: 6.5
  };
  
  const weightKg = weightLbs * 0.453592;
  return mets[intensity] * weightKg * (durationMinutes / 60);
}

// Daily target with goal adjustment
export function getDailyCalorieTarget(
  tdee: number,
  weeklyGoalLbs: number
): number {
  // 3500 calories = 1 lb
  const dailyCalorieAdjustment = (weeklyGoalLbs * 3500) / 7;
  return tdee - dailyCalorieAdjustment; // negative for weight loss, positive for gain
}

// Convert lbs to kg
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

// Convert kg to lbs
export function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

// Calculate 7-day moving average
export function calculateMovingAverage(weights: number[], days: number = 7): number {
  if (weights.length === 0) return 0;
  const slice = weights.slice(0, Math.min(days, weights.length));
  return slice.reduce((sum, w) => sum + w, 0) / slice.length;
}
