import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Dumbbell, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkoutCount() {
  const { data: workoutData } = useQuery({
    queryKey: ["workoutCount"],
    queryFn: () => api.getWorkoutCount(),
  });

  const count = workoutData?.count || 0;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-card to-secondary/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Workouts Logged
            </p>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-5xl font-bold font-heading text-primary">
                {count}
              </span>
              <span className="text-muted-foreground text-sm">sessions</span>
            </motion.div>
            <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Keep it up!</span>
            </div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-7 w-7 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
