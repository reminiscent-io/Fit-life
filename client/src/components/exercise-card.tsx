import { useState } from "react";
import { Edit2, Check, X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ExerciseData {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  unit: string;
}

interface ExerciseCardProps {
  exercise: ExerciseData;
  onUpdate: (id: string, data: Partial<ExerciseData>) => void;
  onDelete: (id: string) => void;
}

export default function ExerciseCard({ exercise, onUpdate, onDelete }: ExerciseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(exercise);

  const handleSave = () => {
    onUpdate(exercise.id, formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(exercise);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="overflow-hidden border-none shadow-sm bg-card hover:bg-accent/5 transition-colors">
        <CardContent className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="font-bold text-lg h-10"
                  placeholder="Exercise Name"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sets</label>
                  <Input
                    type="number"
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Reps</label>
                  <Input
                    type="number"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Lbs</label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-foreground mb-1">{exercise.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <span className="font-mono font-medium text-foreground mr-1">{exercise.sets}</span> sets
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center">
                    <span className="font-mono font-medium text-foreground mr-1">{exercise.reps}</span> reps
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center">
                    <span className="font-mono font-medium text-foreground mr-1">{exercise.weight}</span> {exercise.unit}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(exercise.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
