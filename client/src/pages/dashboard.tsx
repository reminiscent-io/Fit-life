import Layout from "@/components/layout";
import WorkoutCount from "@/components/charts/workout-count";
import ExerciseScatterChart from "@/components/charts/exercise-scatter-chart";
import CardioMetrics from "@/components/charts/cardio-metrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Calendar, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getFirstName(fullName: string | undefined): string {
  if (!fullName) return "there";
  return fullName.split(" ")[0];
}

export default function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.getSessions(),
  });

  const lastWorkout = sessions?.[0];
  const firstName = getFirstName(profile?.name);

  return (
    <Layout>
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-heading font-extrabold text-foreground mb-1">
          {getGreeting()}, <span className="text-primary">{firstName}</span>
        </h1>
        <p className="text-muted-foreground">Ready to crush your goals today?</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <WorkoutCount />

        <Link href="/workout">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/25 cursor-pointer hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />

            <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
              <div>
                <h3 className="font-heading font-bold text-xl mb-1">Start Workout</h3>
                <p className="text-primary-foreground/80 text-sm">Log your sets with voice</p>
              </div>
              <div className="flex justify-end mt-4">
                <div className="h-12 w-12 bg-white text-primary rounded-full flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 ml-1 fill-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <ExerciseScatterChart />
      </section>

      <section className="grid gap-6 md:grid-cols-2 mb-8">
        <CardioMetrics />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading">Recent Activity</h2>
            <Link href="/history">
              <span className="text-sm font-medium text-primary hover:underline flex items-center cursor-pointer">
                View All <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div className="space-y-3">
            {sessions && sessions.length > 0 ? (
              sessions.slice(0, 3).map((workout) => (
                <Card key={workout.id} className="border-none shadow-sm hover:bg-accent/5 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold font-heading">{workout.name || "Workout Session"}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(workout.date), "MMM d")} • {workout.exercises?.length || 0} exercises
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-none shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No recent workouts</p>
                  <Link href="/workout">
                    <Button variant="link" className="mt-2">
                      Start your first workout
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
