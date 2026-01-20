import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Timer, Footprints, Waves } from "lucide-react";

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

interface CardioTypeCardProps {
  activityType: string;
  totalMinutes: number;
  totalSessions: number;
  icon: React.ReactNode;
  color: string;
}

function CardioTypeCard({ activityType, totalMinutes, totalSessions, icon, color }: CardioTypeCardProps) {
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${color} flex items-center gap-4`}>
      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold font-heading text-white capitalize">{activityType}</h4>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <Timer className="h-3 w-3" />
            <span>{formatTime(totalMinutes)}</span>
          </div>
          <div className="text-white/60 text-sm">
            {totalSessions} session{totalSessions !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

const activityConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  running: {
    icon: <Footprints className="h-6 w-6" />,
    color: "from-green-500 to-green-600",
  },
  rowing: {
    icon: <Waves className="h-6 w-6" />,
    color: "from-blue-500 to-blue-600",
  },
  cycling: {
    icon: <Timer className="h-6 w-6" />,
    color: "from-orange-500 to-orange-600",
  },
  swimming: {
    icon: <Waves className="h-6 w-6" />,
    color: "from-cyan-500 to-cyan-600",
  },
  walking: {
    icon: <Footprints className="h-6 w-6" />,
    color: "from-teal-500 to-teal-600",
  },
};

const defaultConfig = {
  icon: <Timer className="h-6 w-6" />,
  color: "from-purple-500 to-purple-600",
};

export default function CardioMetrics() {
  const { data: cardioSummary, isLoading } = useQuery({
    queryKey: ["cardioSummary"],
    queryFn: () => api.getCardioSummary(),
  });

  const totalTime = cardioSummary?.reduce((acc, item) => acc + item.totalMinutes, 0) || 0;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-card to-secondary/50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-end">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Cardio Time
          </CardTitle>
          <div className="text-2xl font-bold font-heading text-primary">
            {formatTime(totalTime)} <span className="text-sm text-muted-foreground font-normal">total</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : !cardioSummary || cardioSummary.length === 0 ? (
          <div className="h-[120px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <Timer className="h-8 w-8 opacity-50" />
            <p>No cardio sessions logged yet</p>
            <p className="text-xs">Add running, rowing, or other cardio activities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cardioSummary.map((item) => {
              const config = activityConfig[item.activityType.toLowerCase()] || defaultConfig;
              return (
                <CardioTypeCard
                  key={item.activityType}
                  activityType={item.activityType}
                  totalMinutes={item.totalMinutes}
                  totalSessions={item.totalSessions}
                  icon={config.icon}
                  color={config.color}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
