import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ZAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Dumbbell } from "lucide-react";

export default function ExerciseScatterChart() {
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const { data: exerciseNames } = useQuery({
    queryKey: ["exerciseNames"],
    queryFn: () => api.getUniqueExerciseNames(),
  });

  const { data: exerciseHistory, isLoading } = useQuery({
    queryKey: ["exerciseHistory", selectedExercise],
    queryFn: () => api.getExerciseHistory(selectedExercise),
    enabled: !!selectedExercise,
  });

  // Transform data for scatter chart - each set becomes a point
  const scatterData = exerciseHistory?.flatMap((entry, idx) => {
    const points = [];
    for (let i = 0; i < entry.sets; i++) {
      points.push({
        reps: entry.reps,
        weight: entry.weight || 0,
        date: entry.date,
        sets: entry.sets,
        index: idx,
      });
    }
    return points;
  }) || [];

  // Get unique data points for display (one per entry)
  const uniqueData = exerciseHistory?.map(entry => ({
    reps: entry.reps,
    weight: entry.weight || 0,
    date: entry.date,
    sets: entry.sets,
  })) || [];

  const hasData = uniqueData.length > 0;
  const maxWeight = hasData ? Math.max(...uniqueData.map(d => d.weight)) : 0;
  const maxReps = hasData ? Math.max(...uniqueData.map(d => d.reps)) : 0;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-card to-secondary/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Exercise Progress
          </CardTitle>
        </div>
        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="Select an exercise" />
          </SelectTrigger>
          <SelectContent>
            {exerciseNames?.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[200px] w-full mt-2">
          {!selectedExercise ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select an exercise to view progress
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : !hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No data for {selectedExercise}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="reps"
                  type="number"
                  name="Reps"
                  domain={[0, maxReps + 2]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ value: 'Reps', position: 'bottom', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  dataKey="weight"
                  type="number"
                  name="Weight"
                  domain={[0, maxWeight + 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ value: 'lbs', angle: -90, position: 'insideLeft', offset: 15, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <ZAxis dataKey="sets" range={[50, 200]} name="Sets" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-bold text-foreground">{data.date}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.sets} sets × {data.reps} reps @ {data.weight} lbs
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={uniqueData}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
