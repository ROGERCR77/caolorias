import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, Play, Pause, Check, X, ArrowRight, 
  Utensils, Leaf, AlertTriangle, Info, Crown
} from "lucide-react";
import { UpgradeModal } from "@/components/app/UpgradeModal";

interface Transition {
  id: string;
  dog_id: string;
  started_at: string;
  total_days: number;
  current_day: number;
  status: string;
  notes: string | null;
}

interface DailyLog {
  id: string;
  transition_id: string;
  day_number: number;
  logged_at: string;
  kibble_percentage: number;
  natural_percentage: number;
  symptoms: string[] | null;
  notes: string | null;
  completed: boolean;
}

// Transition schedule (10 days)
const TRANSITION_SCHEDULE = [
  { day: 1, kibble: 90, natural: 10 },
  { day: 2, kibble: 80, natural: 20 },
  { day: 3, kibble: 70, natural: 30 },
  { day: 4, kibble: 60, natural: 40 },
  { day: 5, kibble: 50, natural: 50 },
  { day: 6, kibble: 40, natural: 60 },
  { day: 7, kibble: 30, natural: 70 },
  { day: 8, kibble: 20, natural: 80 },
  { day: 9, kibble: 10, natural: 90 },
  { day: 10, kibble: 0, natural: 100 },
];

const TRANSITION_SYMPTOMS = [
  { value: 'fezes_moles', label: '💧 Fezes moles' },
  { value: 'gases', label: '💨 Gases' },
  { value: 'vomito', label: '🤢 Vômito' },
  { value: 'recusa', label: '🚫 Recusou comer' },
  { value: 'apatia', label: '😔 Apatia' },
  { value: 'normal', label: '✅ Tudo normal' },
];

export default function DietaryTransition() {
  const { user } = useAuth();
  const { selectedDogId, dogs, isLoading: dataLoading } = useData();
  const { isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  // Daily log form
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [dayNotes, setDayNotes] = useState('');

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Fetch transition data - MUST be before any conditional returns
  useEffect(() => {
    if (!user || !selectedDogId || !isPremium) return;
    
    const fetch = async () => {
      setIsLoading(true);
      
      const { data: transitionData } = await supabase
        .from('dietary_transitions')
        .select('*')
        .eq('dog_id', selectedDogId)
        .eq('status', 'em_andamento')
        .single();

      if (transitionData) {
        setTransition(transitionData);
        
        const { data: logs } = await supabase
          .from('transition_daily_logs')
          .select('*')
          .eq('transition_id', transitionData.id)
          .order('day_number', { ascending: true });
        
        if (logs) setDailyLogs(logs);
      } else {
        setTransition(null);
        setDailyLogs([]);
      }
      
      setIsLoading(false);
    };

    fetch();
  }, [user, selectedDogId, isPremium]);

  // Premium gate - AFTER all hooks
  if (!isPremium && !isLoading && !dataLoading) {
    return (
      <AppLayout>
        <div className="container px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Transição Alimentar</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              Guia completo de 10 dias para transição de ração para alimentação natural. Recurso exclusivo do plano Premium.
            </p>
            <Button onClick={() => setShowUpgrade(true)} variant="hero">
              <Crown className="w-4 h-4 mr-2" />
              Assinar Premium
            </Button>
            <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="dietary_transition" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Start new transition
  const startTransition = async () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    
    if (!user || !selectedDogId) return;
    
    try {
      const { data, error } = await supabase
        .from('dietary_transitions')
        .insert({
          dog_id: selectedDogId,
          user_id: user.id,
          total_days: 10,
          current_day: 1,
          status: 'em_andamento',
        })
        .select()
        .single();

      if (error) throw error;
      
      setTransition(data);
      toast.success('Transição iniciada! Vamos começar devagar.');
    } catch (error) {
      toast.error('Erro ao iniciar transição');
    }
  };

  // Log current day
  const logDay = async () => {
    if (!user || !transition) return;
    
    const schedule = TRANSITION_SCHEDULE[transition.current_day - 1];
    
    try {
      const { error: logError } = await supabase
        .from('transition_daily_logs')
        .insert({
          transition_id: transition.id,
          user_id: user.id,
          day_number: transition.current_day,
          kibble_percentage: schedule.kibble,
          natural_percentage: schedule.natural,
          symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : null,
          notes: dayNotes || null,
          completed: true,
        });

      if (logError) throw logError;

      // Update transition
      const newDay = transition.current_day + 1;
      const isComplete = newDay > 10;
      
      const { error: updateError } = await supabase
        .from('dietary_transitions')
        .update({
          current_day: isComplete ? 10 : newDay,
          status: isComplete ? 'concluida' : 'em_andamento',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transition.id);

      if (updateError) throw updateError;

      if (isComplete) {
        toast.success('🎉 Parabéns! Transição concluída com sucesso!');
        setTransition(null);
      } else {
        toast.success(`Dia ${transition.current_day} registrado!`);
        setTransition({ ...transition, current_day: newDay });
      }
      
      setSelectedSymptoms([]);
      setDayNotes('');
      
      // Refresh logs
      const { data: logs } = await supabase
        .from('transition_daily_logs')
        .select('*')
        .eq('transition_id', transition.id)
        .order('day_number', { ascending: true });
      if (logs) setDailyLogs(logs);
      
    } catch (error) {
      toast.error('Erro ao registrar dia');
    }
  };

  // Cancel transition
  const cancelTransition = async () => {
    if (!transition) return;
    
    try {
      await supabase
        .from('dietary_transitions')
        .update({ status: 'cancelada' })
        .eq('id', transition.id);
      
      setTransition(null);
      setDailyLogs([]);
      toast.success('Transição cancelada');
    } catch (error) {
      toast.error('Erro ao cancelar');
    }
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

  const currentSchedule = transition ? TRANSITION_SCHEDULE[transition.current_day - 1] : null;
  const progress = transition ? ((transition.current_day - 1) / 10) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-4 pb-24 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Transição Alimentar</h1>
            <p className="text-sm text-muted-foreground">Ração → Natural em 10 dias</p>
          </div>
          <DogSelector />
        </div>

        {/* Premium Badge */}
        {!isPremium && (
          <Card className="bg-gradient-to-r from-warning/10 to-accent/10 border-warning/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="h-6 w-6 text-warning" />
              <div className="flex-1">
                <p className="font-semibold">Recurso Premium</p>
                <p className="text-sm text-muted-foreground">
                  Assine para acessar a transição alimentar guiada
                </p>
              </div>
              <Button size="sm" onClick={() => setShowUpgrade(true)}>
                Assinar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No active transition */}
        {!transition && (
          <Card className="text-center py-8">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Pronto para mudar?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A transição gradual em 10 dias é a forma mais segura de migrar 
                  da ração para alimentação natural.
                </p>
              </div>
              <Button onClick={startTransition} className="gap-2">
                <Play className="h-4 w-4" />
                Iniciar Transição
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active transition */}
        {transition && currentSchedule && (
          <>
            {/* Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Progresso de {selectedDog?.name}</span>
                  <Badge variant="secondary">Dia {transition.current_day}/10</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress === 0 ? 'Vamos começar!' : progress >= 100 ? 'Quase lá!' : `${Math.round(progress)}% concluído`}
                </p>
              </CardContent>
            </Card>

            {/* Today's proportion */}
            <Card className="bg-gradient-to-r from-amber-500/10 to-green-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Proporção de Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Utensils className="h-4 w-4 text-amber-600" />
                      <span className="text-2xl font-bold text-amber-600">{currentSchedule.kibble}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ração</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Leaf className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{currentSchedule.natural}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Natural</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Log today */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Como foi a refeição?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sintomas observados</p>
                  <div className="flex flex-wrap gap-2">
                    {TRANSITION_SYMPTOMS.map(s => (
                      <Button
                        key={s.value}
                        variant={selectedSymptoms.includes(s.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedSymptoms(prev => 
                            prev.includes(s.value) 
                              ? prev.filter(x => x !== s.value)
                              : [...prev, s.value]
                          );
                        }}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Textarea 
                  value={dayNotes}
                  onChange={(e) => setDayNotes(e.target.value)}
                  placeholder="Observações do dia (opcional)"
                />

                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" onClick={logDay}>
                    <Check className="h-4 w-4" />
                    Concluir Dia {transition.current_day}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelTransition}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Dica do dia {transition.current_day}</p>
                    {transition.current_day <= 3 && (
                      <p className="text-muted-foreground">
                        Nos primeiros dias, misture bem a ração com o natural para seu cão se acostumar com os novos sabores e texturas.
                      </p>
                    )}
                    {transition.current_day > 3 && transition.current_day <= 6 && (
                      <p className="text-muted-foreground">
                        Se notar fezes mais moles, é normal! O intestino está se adaptando. Se persistir por mais de 2 dias, reduza a velocidade.
                      </p>
                    )}
                    {transition.current_day > 6 && (
                      <p className="text-muted-foreground">
                        Você está quase lá! Observe se seu cão está mais animado e com mais energia - são sinais de que a transição está funcionando.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History */}
            {dailyLogs.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Histórico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dailyLogs.map(log => (
                      <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Badge variant="outline">Dia {log.day_number}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.kibble_percentage}% ração / {log.natural_percentage}% natural
                        </span>
                        {log.symptoms?.includes('normal') && (
                          <Check className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                        {log.symptoms?.some(s => ['vomito', 'recusa'].includes(s)) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            A transição alimentar deve ser acompanhada. Em caso de vômitos persistentes, 
            diarreia intensa ou recusa alimentar, consulte um médico-veterinário.
          </p>
        </div>
        
        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature="dietary_transition"
        />
      </div>
    </AppLayout>
  );
}
