import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, TrendingUp, TrendingDown, Minus, 
  Target, Flame, Scale, Crown, ChevronRight
} from "lucide-react";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface WeeklyInsightsCardProps {
  dogId: string;
}

export function WeeklyInsightsCard({ dogId }: WeeklyInsightsCardProps) {
  const { user } = useAuth();
  const { dogs, meals, weightLogs } = useData();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [activityData, setActivityData] = useState<any[]>([]);

  const dog = dogs.find(d => d.id === dogId);
  if (!dog) return null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

  // Filter this week's meals
  const weekMeals = meals.filter(m => 
    m.dog_id === dogId && 
    isWithinInterval(parseISO(m.date_time), { start: weekStart, end: weekEnd })
  );

  // Calculate metrics
  const totalKcal = weekMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0);
  const avgDailyKcal = weekMeals.length > 0 ? Math.round(totalKcal / 7) : 0;
  const metaKcal = dog.meta_kcal_dia || 0;
  const percentOfGoal = metaKcal > 0 ? Math.round((avgDailyKcal / metaKcal) * 100) : 0;

  // Get unique days with meals
  const daysWithMeals = new Set(
    weekMeals.map(m => format(parseISO(m.date_time), 'yyyy-MM-dd'))
  ).size;

  // Weight change
  const recentWeights = weightLogs
    .filter(w => w.dog_id === dogId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const latestWeight = recentWeights[0]?.weight_kg || 0;
  const previousWeight = recentWeights[1]?.weight_kg || latestWeight;
  const weightChange = latestWeight - previousWeight;

  // Fetch activity data
  useEffect(() => {
    if (!user || !dogId) return;
    
    const fetchActivity = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('duration_minutes')
        .eq('dog_id', dogId)
        .gte('logged_at', weekStart.toISOString())
        .lte('logged_at', weekEnd.toISOString());
      
      if (data) setActivityData(data);
    };
    
    fetchActivity();
  }, [user, dogId]);

  const totalActivityMinutes = activityData.reduce((sum, a) => sum + a.duration_minutes, 0);

  // Generate insight message
  const getInsightMessage = () => {
    if (percentOfGoal >= 90 && percentOfGoal <= 110) {
      return { 
        text: `${dog.name} está comendo dentro da meta! Continue assim.`, 
        type: 'success' 
      };
    } else if (percentOfGoal > 110) {
      return { 
        text: `${dog.name} está comendo acima da meta. Considere ajustar as porções.`, 
        type: 'warning' 
      };
    } else if (percentOfGoal < 90 && percentOfGoal > 0) {
      return { 
        text: `${dog.name} está comendo abaixo da meta. Vale observar o apetite.`, 
        type: 'warning' 
      };
    }
    return { text: 'Continue registrando para receber insights personalizados.', type: 'neutral' };
  };

  const insight = getInsightMessage();

  // Show premium lock for free users
  if (!isPremium) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <Crown className="h-8 w-8 text-warning mb-2" />
          <p className="text-sm font-medium">Insights da Semana</p>
          <p className="text-xs text-muted-foreground">Disponível no Premium</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={() => navigate('/app/assinatura')}
          >
            Assinar
          </Button>
        </div>
        <CardContent className="p-4 opacity-30">
          <div className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Insights da Semana
          <Badge variant="outline" className="ml-auto text-xs">
            {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM", { locale: ptBR })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main insight */}
        <div className={`p-3 rounded-lg ${
          insight.type === 'success' ? 'bg-green-500/10' :
          insight.type === 'warning' ? 'bg-yellow-500/10' :
          'bg-muted/50'
        }`}>
          <p className="text-sm">{insight.text}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Goal progress */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Meta
            </div>
            <p className="text-lg font-bold">{percentOfGoal}%</p>
            <Progress value={Math.min(percentOfGoal, 100)} className="h-1.5" />
          </div>

          {/* Days logged */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3" />
              Dias registrados
            </div>
            <p className="text-lg font-bold">{daysWithMeals}/7</p>
            <Progress value={(daysWithMeals / 7) * 100} className="h-1.5" />
          </div>

          {/* Weight trend */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Scale className="h-3 w-3" />
              Peso
            </div>
            <div className="flex items-center gap-1">
              <p className="text-lg font-bold">{latestWeight} kg</p>
              {weightChange !== 0 && (
                <span className={`text-xs ${weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Atividade
            </div>
            <p className="text-lg font-bold">{totalActivityMinutes} min</p>
          </div>
        </div>

        {/* Quick action */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs gap-1"
          onClick={() => navigate('/app/historico-insights')}
        >
          Ver histórico completo
          <ChevronRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
