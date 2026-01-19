import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeightData {
  date: string;
  weight: number;
}

export default function WeightChart({ data }: { data: WeightData[] }) {
  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-gradient-to-br from-card to-secondary/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weight Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">No weight data yet</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate min/max for better domain
  const weights = data.map(d => d.weight);
  const minWeight = Math.floor(Math.min(...weights) - 2);
  const maxWeight = Math.ceil(Math.max(...weights) + 2);

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-card to-secondary/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-end">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weight Trend</CardTitle>
          <div className="text-2xl font-bold font-heading text-primary">
            {data[data.length - 1].weight} <span className="text-sm text-muted-foreground font-normal">lbs</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                domain={[minWeight, maxWeight]} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
