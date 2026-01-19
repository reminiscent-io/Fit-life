export const workoutHistory = [
  {
    id: "1",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // Yesterday
    name: "Upper Body Power",
    exercises: [
      { name: "Bench Press", sets: "4x8", weight: "185 lbs" },
      { name: "Pull Ups", sets: "3x10", weight: "BW" },
      { name: "Shoulder Press", sets: "3x12", weight: "50 lbs" },
    ],
    calories: 420,
    duration: "55 min",
  },
  {
    id: "2",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    name: "Leg Day",
    exercises: [
      { name: "Squats", sets: "5x5", weight: "225 lbs" },
      { name: "Lunges", sets: "3x12", weight: "40 lbs" },
      { name: "Calf Raises", sets: "4x15", weight: "135 lbs" },
    ],
    calories: 550,
    duration: "65 min",
  },
];

export const weightData = [
  { date: "Jan 12", weight: 195.0 },
  { date: "Jan 13", weight: 194.8 },
  { date: "Jan 14", weight: 194.2 },
  { date: "Jan 15", weight: 194.5 },
  { date: "Jan 16", weight: 193.8 },
  { date: "Jan 17", weight: 193.5 },
  { date: "Jan 18", weight: 193.2 },
];

export const mockParseResponse = {
  exercise: "Dumbbell Curls",
  reps: 12,
  sets: 3,
  weight: 45,
  unit: "lbs",
  confidence: "high"
};
