import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, Plus, Trash2, Footprints, Timer, Flame, 
  TrendingUp, Target, Dumbbell
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ActivityLog {
  id: string;
  dog_id: string;
  type: string;
  duration_minutes: number;
  intensity: string;
  notes: string | null;
  logged_at: string;
}

const ACTIVITY_TYPES = [
  { value: 'caminhada', label: '🚶 Caminhada', icon: Footprints },
  { value: 'corrida', label: '🏃 Corrida', icon: Footprints },
  { value: 'brincadeira', label: '🎾 Brincadeira', icon: Dumbbell },
  { value: 'natacao', label: '🏊 Natação', icon: Dumbbell },
  { value: 'outro', label: '📋 Outro', icon: Timer },
];

const INTENSITIES = [
  { value: 'leve', label: 'Leve', color: 'bg-green-500', multiplier: 0.8 },
  { value: 'moderada', label: 'Moderada', color: 'bg-yellow-500', multiplier: 1 },
  { value: 'intensa', label: 'Intensa', color: 'bg-red-500', multiplier: 1.3 },
];

const QUICK_DURATIONS = [10, 15, 20, 30, 45, 60];

export default function Activity() {
  const { user } = useAuth();
  const { selectedDogId, dogs, getActivityReference, isLoading: dataLoading } = useData();
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [activityType, setActivityType] = useState('caminhada');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('moderada');
  const [notes, setNotes] = useState('');

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Get activity reference for the dog
  const sizeToPorte: Record<string, string> = {
    small: 'pequeno',
    medium: 'medio',
    large: 'grande',
    giant: 'gigante',
  };
  
  const dogPorte = sizeToPorte[selectedDog?.size || 'medium'] || 'medio';
  const activityRef = selectedDog ? getActivityReference(
    dogPorte as any,
    selectedDog.nivel_atividade || 'moderada'
  ) : null;

  const dailyGoalMin = activityRef?.minutos_min_dia || 30;
  const dailyGoalMax = activityRef?.minutos_max_dia || 60;
  const dailyGoalAvg = (dailyGoalMin + dailyGoalMax) / 2;

  // Fetch activities
  useEffect(() => {
    if (!user || !selectedDogId) return;
    
    const fetchActivities = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('logged_at', { ascending: false })
        .limit(50);

      if (data) setActivities(data);
      setIsLoading(false);
    };

    fetchActivities();
  }, [user, selectedDogId]);

  // Calculate today's total
  const todayActivities = activities.filter(a => isToday(parseISO(a.logged_at)));
  const todayTotal = todayActivities.reduce((sum, a) => sum + a.duration_minutes, 0);
  const todayProgress = Math.min(100, (todayTotal / dailyGoalAvg) * 100);

  // Calculate week's total
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const weekActivities = activities.filter(a => 
    isWithinInterval(parseISO(a.logged_at), { start: weekStart, end: weekEnd })
  );
  const weekTotal = weekActivities.reduce((sum, a) => sum + a.duration_minutes, 0);
  const weekGoal = dailyGoalAvg * 7;
  const weekProgress = Math.min(100, (weekTotal / weekGoal) * 100);

  // Save activity
  const saveActivity = async () => {
    if (!user || !selectedDogId || duration <= 0) return;
    
    try {
      const { error } = await supabase.from('activity_logs').insert({
        dog_id: selectedDogId,
        user_id: user.id,
        type: activityType,
        duration_minutes: duration,
        intensity: intensity,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success('Atividade registrada!');
      setDialogOpen(false);
      resetForm();
      
      // Refresh
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('logged_at', { ascending: false })
        .limit(50);
      if (data) setActivities(data);
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Erro ao salvar atividade');
    }
  };

  // Delete activity
  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from('activity_logs').delete().eq('id', id);
      if (error) throw error;
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success('Atividade excluída');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setActivityType('caminhada');
    setDuration(30);
    setIntensity('moderada');
    setNotes('');
  };

  if (dataLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (dogs.length === 0) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Cadastre um cão primeiro.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Atividade Física</h1>
            <p className="text-sm text-muted-foreground">Caminhadas e exercícios</p>
          </div>
          <DogSelector />
        </div>

        {/* Today's Progress */}
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Meta de Hoje</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {dailyGoalMin}-{dailyGoalMax} min
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-lg">{todayTotal} min</span>
                <span className="text-muted-foreground">
                  {todayTotal >= dailyGoalMin ? '✅ Meta atingida!' : `Faltam ${dailyGoalMin - todayTotal} min`}
                </span>
              </div>
              <Progress value={todayProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Week Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Esta semana</span>
              </div>
              <p className="text-xl font-bold">{weekTotal} min</p>
              <p className="text-xs text-muted-foreground">de {Math.round(weekGoal)} min</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Atividades</span>
              </div>
              <p className="text-xl font-bold">{weekActivities.length}</p>
              <p className="text-xs text-muted-foreground">esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Registrar Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Nova Atividade</DialogTitle>
              <DialogDescription>
                Registre a atividade física de {selectedDog?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
              {/* Type */}
              <div>
                <p className="text-sm font-medium mb-2">Tipo</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_TYPES.map(t => (
                    <Button
                      key={t.value}
                      variant={activityType === t.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActivityType(t.value)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Duration */}
              <div>
                <p className="text-sm font-medium mb-2">Duração (minutos)</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {QUICK_DURATIONS.map(d => (
                    <Button
                      key={d}
                      variant={duration === d ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration(d)}
                    >
                      {d} min
                    </Button>
                  ))}
                </div>
                <Input 
                  type="number"
                  min={1}
                  max={240}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  placeholder="Ou digite os minutos"
                />
              </div>

              {/* Intensity */}
              <div>
                <p className="text-sm font-medium mb-2">Intensidade</p>
                <div className="flex gap-2">
                  {INTENSITIES.map(i => (
                    <Button
                      key={i.value}
                      variant={intensity === i.value ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setIntensity(i.value)}
                    >
                      <span className={`w-2 h-2 rounded-full ${i.color}`} />
                      {i.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm font-medium mb-2">Observações (opcional)</p>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Onde foi? Como se comportou?"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={saveActivity}
                disabled={duration <= 0}
              >
                Salvar Atividade
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Activities List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Histórico</h3>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            activities.map(activity => {
              const typeInfo = ACTIVITY_TYPES.find(t => t.value === activity.type);
              const intensityInfo = INTENSITIES.find(i => i.value === activity.intensity);
              
              return (
                <Card key={activity.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{typeInfo?.label || activity.type}</Badge>
                          <span className="font-bold">{activity.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs gap-1">
                            <span className={`w-2 h-2 rounded-full ${intensityInfo?.color}`} />
                            {intensityInfo?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(activity.logged_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground">{activity.notes}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Activity Tip */}
        {activityRef && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                💡 {activityRef.observacao || `Recomendado ${dailyGoalMin}-${dailyGoalMax} minutos de atividade por dia para cães de porte ${selectedDog?.size} com energia ${selectedDog?.nivel_atividade}.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
