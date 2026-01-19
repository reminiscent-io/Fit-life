import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import MicButton from "@/components/mic-button";
import ExerciseCard from "@/components/exercise-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Exercise } from "@/lib/api";

export default function WorkoutSession() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Get or create today's session
  const { data: todaySession } = useQuery({
    queryKey: ["session", "today"],
    queryFn: () => api.getTodaySession(),
  });

  const createSessionMutation = useMutation({
    mutationFn: () => api.createSession(),
    onSuccess: (session) => {
      setCurrentSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ["session", "today"] });
    },
  });

  const createExerciseMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createExercise>[0]) => api.createExercise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", "today"] });
      toast({
        title: "Exercise Logged",
        description: "Exercise added successfully",
      });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Exercise> }) => 
      api.updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", "today"] });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: number) => api.deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", "today"] });
    },
  });

  useEffect(() => {
    if (todaySession) {
      setCurrentSessionId(todaySession.id);
    } else if (!currentSessionId) {
      // Create session on mount if none exists
      createSessionMutation.mutate();
    }
  }, [todaySession]);

  const handleVoiceInput = async (text: string) => {
    if (!currentSessionId) return;
    
    setIsProcessing(true);
    
    try {
      // Parse the voice input
      const parsed = await api.parseWorkout(text);
      
      // Create exercise from parsed data
      await createExerciseMutation.mutateAsync({
        sessionId: currentSessionId,
        exerciseName: parsed.exercise,
        reps: parsed.reps,
        sets: parsed.sets,
        weight: parsed.weight,
        weightUnit: parsed.unit,
        rawVoiceInput: text,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse workout. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateExercise = (id: number, data: any) => {
    updateExerciseMutation.mutate({ id, data });
  };

  const handleDeleteExercise = (id: number) => {
    deleteExerciseMutation.mutate(id);
  };

  const handleFinishWorkout = async () => {
    if (!currentSessionId) return;
    
    // Update session end time
    await api.updateSession(currentSessionId, { endTime: new Date().toISOString() });
    
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    
    toast({
      title: "Workout Saved",
      description: "Great job! Your session has been recorded.",
    });
    setLocation("/");
  };

  const exercises = todaySession?.exercises || [];

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
                exercise={{
                  id: ex.id.toString(),
                  name: ex.exerciseName,
                  sets: ex.sets,
                  reps: ex.reps,
                  weight: ex.weight || 0,
                  unit: ex.weightUnit || "lbs"
                }} 
                onUpdate={(id, data) => handleUpdateExercise(parseInt(id), {
                  exerciseName: data.name,
                  sets: data.sets,
                  reps: data.reps,
                  weight: data.weight,
                  weightUnit: data.unit
                })}
                onDelete={(id) => handleDeleteExercise(parseInt(id))}
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
