import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Dumbbell } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface QuickAddChipsProps {
  onAddExercise: (data: {
    exerciseName: string;
    sets: number;
    reps: number;
    weight?: number;
    weightUnit: string;
  }) => void;
  disabled?: boolean;
}

export default function QuickAddChips({ onAddExercise, disabled }: QuickAddChipsProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<string>("");

  const { data: exerciseNames } = useQuery({
    queryKey: ["exerciseNames"],
    queryFn: () => api.getExerciseNames(),
  });

  // Get top 5 most used exercises
  const topExercises = exerciseNames
    ?.sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5) || [];

  const handleChipClick = (name: string) => {
    setSelectedExercise(name);
    // Reset form with defaults
    setSets(3);
    setReps(10);
    setWeight("");
  };

  const handleAdd = () => {
    if (!selectedExercise) return;

    onAddExercise({
      exerciseName: selectedExercise,
      sets,
      reps,
      weight: weight ? parseFloat(weight) : undefined,
      weightUnit: "lbs",
    });

    setSelectedExercise(null);
  };

  // Don't render if no exercise history yet
  if (!topExercises.length) return null;

  return (
    <>
      {/* Chips Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs text-muted-foreground flex items-center shrink-0">
          Quick add:
        </span>
        {topExercises.map((ex) => (
          <button
            key={ex.name}
            onClick={() => handleChipClick(ex.name)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            {ex.name}
          </button>
        ))}
      </div>

      {/* Quick Add Drawer */}
      <Drawer open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 justify-center">
              <Dumbbell className="h-5 w-5" />
              {selectedExercise}
            </DrawerTitle>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sets" className="text-center block">Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  inputMode="numeric"
                  value={sets}
                  onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                  className="text-center text-lg font-semibold"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps" className="text-center block">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                  className="text-center text-lg font-semibold"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-center block">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  placeholder="—"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-center text-lg font-semibold"
                  min={0}
                />
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleAdd} size="lg" className="w-full">
              Add Exercise
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="lg" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
