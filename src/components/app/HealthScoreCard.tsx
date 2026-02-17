import { useHealthScore } from "@/hooks/useHealthScore";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { FeatureGateBlur } from "./FeatureGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Loader2 } from "lucide-react";

function ScoreGauge({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score < 40 ? "#ef4444" : score < 70 ? "#eab308" : "#22c55e";

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-muted-foreground">de 100</span>
      </div>
    </div>
  );
}

const BREAKDOWN_LABELS: Record<string, { label: string; max: number }> = {
  meals: { label: "Alimentacao", max: 25 },
  weight: { label: "Peso", max: 25 },
  activity: { label: "Atividade", max: 20 },
  digestive: { label: "Digestao", max: 15 },
  vaccines: { label: "Vacinas", max: 15 },
};

function BreakdownSection({ breakdown }: { breakdown: Record<string, number> }) {
  return (
    <div className="space-y-2 mt-4">
      {Object.entries(BREAKDOWN_LABELS).map(([key, { label, max }]) => {
        const value = breakdown[key] || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}/{max}</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}

interface HealthScoreCardProps {
  dogId: string | undefined;
}

export function HealthScoreCard({ dogId }: HealthScoreCardProps) {
  const { score, breakdown, isLoading } = useHealthScore(dogId);
  const { isPremium } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center min-h-[120px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          Score de Saude
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScoreGauge score={score} />
        {isPremium ? (
          <BreakdownSection breakdown={breakdown} />
        ) : (
          <FeatureGateBlur feature="health_score" overlayText="Desbloqueie o detalhamento completo">
            <BreakdownSection breakdown={breakdown} />
          </FeatureGateBlur>
        )}
      </CardContent>
    </Card>
  );
}
