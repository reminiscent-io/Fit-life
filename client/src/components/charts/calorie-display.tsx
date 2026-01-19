import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CalorieDisplayProps {
  current: number;
  target: number;
}

export default function CalorieDisplay({ current, target }: CalorieDisplayProps) {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <Card className="border-none shadow-sm bg-card overflow-hidden relative">
       {/* Background accent blob */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
      
      <CardContent className="p-5 flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Flame className="h-4 w-4 text-accent" />
            Daily Calories
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-heading">{current}</span>
            <span className="text-sm text-muted-foreground">/ {target}</span>
          </div>
        </div>
        
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              fill="none"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="hsl(var(--accent))"
              strokeWidth="6"
              fill="none"
              strokeDasharray={175.9}
              initial={{ strokeDashoffset: 175.9 }}
              animate={{ strokeDashoffset: 175.9 - (175.9 * percentage) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xs font-bold text-accent">
            {Math.round(percentage)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
