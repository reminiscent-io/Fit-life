import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workoutHistory } from "@/lib/mockData";
import { Calendar, Clock, Trophy } from "lucide-react";

export default function History() {
  return (
    <Layout>
       <header className="mb-6 pt-4">
        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">
          History
        </h1>
        <p className="text-muted-foreground">Your past workouts</p>
      </header>

      <div className="space-y-4">
        {workoutHistory.map((session) => (
          <Card key={session.id} className="border-none shadow-sm hover:bg-accent/5 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-heading text-lg font-bold">{session.name}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    {session.date.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    PR
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {session.duration}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-bold text-foreground">{session.calories}</span> cal
                </span>
              </div>
              
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {session.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-muted-foreground">{ex.sets} @ {ex.weight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
