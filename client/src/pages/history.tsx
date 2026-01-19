import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";

export default function History() {
  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.getSessions(),
  });

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return null;
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60;
    return Math.round(duration);
  };

  return (
    <Layout>
       <header className="mb-6 pt-4">
        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">
          History
        </h1>
        <p className="text-muted-foreground">Your past workouts</p>
      </header>

      <div className="space-y-4">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => {
            const duration = calculateDuration(session.startTime, session.endTime);
            return (
              <Card key={session.id} className="border-none shadow-sm hover:bg-accent/5 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-heading text-lg font-bold">
                        {session.name || "Workout Session"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.date), "PPP")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                    {duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {duration} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-foreground">{session.exercises?.length || 0}</span> exercises
                    </span>
                  </div>
                  
                  {session.exercises && session.exercises.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-border">
                      {session.exercises.map((ex) => (
                        <div key={ex.id} className="flex justify-between text-sm">
                          <span className="font-medium">{ex.exerciseName}</span>
                          <span className="text-muted-foreground">
                            {ex.sets}x{ex.reps} @ {ex.weight || 0} {ex.weightUnit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground py-8">No workout history yet</p>
        )}
      </div>
    </Layout>
  );
}
