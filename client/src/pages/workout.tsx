import { useState } from "react";
import Layout from "@/components/layout";
import MicButton from "@/components/mic-button";
import ExerciseCard from "@/components/exercise-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { mockParseResponse } from "@/lib/mockData";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

export default function WorkoutSession() {
  const [, setLocation] = useLocation();
  const [exercises, setExercises] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceInput = async (text: string) => {
    setIsProcessing(true);
    
    // Simulate API delay
    setTimeout(() => {
      const newExercise = {
        id: uuidv4(),
        name: mockParseResponse.exercise,
        sets: mockParseResponse.sets,
        reps: mockParseResponse.reps,
        weight: mockParseResponse.weight,
        unit: mockParseResponse.unit,
      };
      
      setExercises(prev => [...prev, newExercise]);
      setIsProcessing(false);
      toast({
        title: "Exercise Logged",
        description: `Added ${newExercise.name}`,
      });
    }, 1500);
  };

  const handleUpdateExercise = (id: string, data: any) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, ...data } : ex));
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleFinishWorkout = () => {
    toast({
      title: "Workout Saved",
      description: "Great job! Your session has been recorded.",
    });
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold font-heading">Current Session</h1>
        <Button 
          size="sm" 
          variant={exercises.length > 0 ? "default" : "secondary"}
          onClick={handleFinishWorkout}
          disabled={exercises.length === 0}
        >
          Finish
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-40 max-w-md mx-auto w-full space-y-4">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 opacity-50">
            <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Start your workout</h3>
              <p className="text-muted-foreground">Tap the mic to log your first set</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex) => (
              <ExerciseCard 
                key={ex.id} 
                exercise={ex} 
                onUpdate={handleUpdateExercise}
                onDelete={handleDeleteExercise}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mic Interface Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-20 flex flex-col items-center justify-end z-30 pointer-events-none">
        <div className="pointer-events-auto mb-4">
          <MicButton onRecordingComplete={handleVoiceInput} isProcessing={isProcessing} />
        </div>
        <p className="text-xs text-muted-foreground text-center mb-2">
          Try saying: "3 sets of bench press at 135 pounds"
        </p>
      </div>
    </div>
  );
}
