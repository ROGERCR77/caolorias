import { useState, useEffect, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, Play, Check, X, ArrowRight, 
  Utensils, Leaf, AlertTriangle, Info, Crown, 
  Clock, HelpCircle, Turtle, Dog, Rabbit
} from "lucide-react";
import { UpgradeModal } from "@/components/app/UpgradeModal";
import { TransitionFoodGuide } from "@/components/app/TransitionFoodGuide";
import { TransitionCalculator } from "@/components/app/TransitionCalculator";
import { TransitionChecklist } from "@/components/app/TransitionChecklist";
import { TransitionAlerts } from "@/components/app/TransitionAlerts";

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

// Transition schedules for different speeds
const TRANSITION_SPEEDS = {
  cautious: {
    name: "Cautelosa",
    days: 14,
    icon: Turtle,
    description: "Para cães sensíveis, idosos ou filhotes",
    schedule: [
      { day: 1, kibble: 95, natural: 5 },
      { day: 2, kibble: 90, natural: 10 },
      { day: 3, kibble: 85, natural: 15 },
      { day: 4, kibble: 80, natural: 20 },
      { day: 5, kibble: 75, natural: 25 },
      { day: 6, kibble: 70, natural: 30 },
      { day: 7, kibble: 65, natural: 35 },
      { day: 8, kibble: 55, natural: 45 },
      { day: 9, kibble: 45, natural: 55 },
      { day: 10, kibble: 35, natural: 65 },
      { day: 11, kibble: 25, natural: 75 },
      { day: 12, kibble: 15, natural: 85 },
      { day: 13, kibble: 5, natural: 95 },
      { day: 14, kibble: 0, natural: 100 },
    ],
  },
  normal: {
    name: "Normal",
    days: 10,
    icon: Dog,
    description: "Padrão recomendado para maioria dos cães",
    schedule: [
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
    ],
  },
  fast: {
    name: "Acelerada",
    days: 7,
    icon: Rabbit,
    description: "Para cães adultos saudáveis sem histórico de sensibilidade",
    schedule: [
      { day: 1, kibble: 85, natural: 15 },
      { day: 2, kibble: 70, natural: 30 },
      { day: 3, kibble: 55, natural: 45 },
      { day: 4, kibble: 40, natural: 60 },
      { day: 5, kibble: 25, natural: 75 },
      { day: 6, kibble: 10, natural: 90 },
      { day: 7, kibble: 0, natural: 100 },
    ],
  },
};

const TRANSITION_SYMPTOMS = [
  { value: 'fezes_moles', label: '💧 Fezes moles' },
  { value: 'gases', label: '💨 Gases' },
  { value: 'vomito', label: '🤢 Vômito' },
  { value: 'recusa', label: '🚫 Recusou comer' },
  { value: 'apatia', label: '😔 Apatia' },
  { value: 'coceira', label: '🐾 Coceira' },
  { value: 'mais_energia', label: '⚡ Mais energia' },
  { value: 'normal', label: '✅ Tudo normal' },
];

const DAY_TIPS: Record<number, string> = {
  1: "Misture bem a ração com o natural para seu cão se acostumar com os novos sabores e texturas. Observe com atenção!",
  2: "Observe as fezes - mudança de cor e consistência são normais. Mantenha água fresca sempre disponível.",
  3: "Se notar fezes muito moles, mantenha a proporção de ontem por mais um dia antes de avançar.",
  4: "Seu cão está se adaptando! Continue observando os sinais e mantenha a rotina de horários.",
  5: "Marco importante! Vocês já estão na metade. Se chegou até aqui sem problemas, está no caminho certo.",
  6: "A maior parte agora é natural. O intestino do seu cão já está se adaptando bem.",
  7: "Reta final! Continue atento aos sinais e celebre cada conquista.",
  8: "Quase lá! Observe se seu cão está mais animado - é sinal de que está funcionando.",
  9: "Último empurrãozinho! Amanhã será 100% natural.",
  10: "🎉 Parabéns! Transição completa. Agora mantenha a variedade de proteínas ao longo da semana.",
};

const FAQ_ITEMS = [
  {
    question: "E se meu cão não quiser comer?",
    answer: "Tente aquecer levemente a comida (morna, não quente) ou adicione um pouco de caldo de frango sem sal. Se recusar por mais de 2 refeições seguidas, volte às proporções do dia anterior.",
  },
  {
    question: "E se as fezes ficarem muito moles?",
    answer: "Fezes um pouco mais moles são normais nos primeiros dias. Se ficarem muito líquidas ou persistirem por mais de 2-3 dias, reduza 10% do natural e aumente a ração. Volte a avançar quando normalizar.",
  },
  {
    question: "Posso dar petiscos durante a transição?",
    answer: "Evite introduzir novos petiscos durante a transição para identificar melhor qualquer reação. Se for dar, prefira pedacinhos dos alimentos que já está oferecendo.",
  },
  {
    question: "E se eu esquecer um dia?",
    answer: "Sem problemas! Continue de onde parou. A transição é flexível - o importante é ser gradual.",
  },
  {
    question: "Posso voltar para ração depois?",
    answer: "Sim, mas faça uma transição reversa também gradual (3-5 dias) para não causar desconforto intestinal.",
  },
  {
    question: "Preciso cozinhar a comida?",
    answer: "Sim, especialmente na transição. Alimentos cozidos são mais fáceis de digerir. Depois de adaptado, você pode considerar alimentação crua se for orientado por um veterinário.",
  },
];

export default function DietaryTransition() {
  const { user } = useAuth();
  const { selectedDogId, dogs, isLoading: dataLoading } = useData();
  const { isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<keyof typeof TRANSITION_SPEEDS>("normal");
  
  // Daily log form
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [dayNotes, setDayNotes] = useState('');

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Calculate consecutive issues
  const consecutiveIssues = useMemo(() => {
    const lastLogs = dailyLogs.slice(-3);
    let count = 0;
    for (const log of lastLogs.reverse()) {
      if (log.symptoms?.some(s => ['fezes_moles', 'vomito', 'recusa'].includes(s))) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [dailyLogs]);

  // Fetch transition data
  useEffect(() => {
    if (!user || !selectedDogId || !isPremium) return;
    
    const fetchData = async () => {
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

    fetchData();
  }, [user, selectedDogId, isPremium]);

  // Premium gate
  if (!isPremium && !isLoading && !dataLoading) {
    return (
      <AppLayout>
        <div className="page-container">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Transição Alimentar</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              Guia completo para transição de ração para alimentação natural. Recurso exclusivo do plano Premium.
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

  // Get current schedule based on transition
  const getSchedule = () => {
    if (!transition) return TRANSITION_SPEEDS.normal.schedule;
    // Determine speed by total_days
    if (transition.total_days === 14) return TRANSITION_SPEEDS.cautious.schedule;
    if (transition.total_days === 7) return TRANSITION_SPEEDS.fast.schedule;
    return TRANSITION_SPEEDS.normal.schedule;
  };

  // Start new transition
  const startTransition = async () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    
    if (!user || !selectedDogId) return;
    
    const speed = TRANSITION_SPEEDS[selectedSpeed];
    
    try {
      const { data, error } = await supabase
        .from('dietary_transitions')
        .insert({
          dog_id: selectedDogId,
          user_id: user.id,
          total_days: speed.days,
          current_day: 1,
          status: 'em_andamento',
        })
        .select()
        .single();

      if (error) throw error;
      
      setTransition(data);
      setShowChecklist(false);
      toast.success(`Transição ${speed.name.toLowerCase()} iniciada! ${speed.days} dias pela frente.`);
    } catch (error) {
      toast.error('Erro ao iniciar transição');
    }
  };

  // Log current day
  const logDay = async () => {
    if (!user || !transition) return;
    
    const schedule = getSchedule()[transition.current_day - 1];
    
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

      const newDay = transition.current_day + 1;
      const isComplete = newDay > transition.total_days;
      
      const { error: updateError } = await supabase
        .from('dietary_transitions')
        .update({
          current_day: isComplete ? transition.total_days : newDay,
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

  const currentSchedule = transition ? getSchedule()[transition.current_day - 1] : null;
  const progress = transition ? ((transition.current_day - 1) / transition.total_days) * 100 : 0;
  const currentTip = transition ? DAY_TIPS[Math.min(transition.current_day, 10)] : "";

  return (
    <AppLayout>
      <div className="page-container page-content pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Transição Alimentar</h1>
            <p className="text-sm text-muted-foreground">Ração → Natural</p>
          </div>
          <DogSelector />
        </div>

        {/* No active transition - Show intro and checklist */}
        {!transition && !showChecklist && (
          <>
            {/* Educational intro */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Leaf className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h2 className="font-semibold mb-1">Por que fazer a transição gradual?</h2>
                    <p className="text-sm text-muted-foreground">
                      A mudança abrupta de ração para comida natural pode causar problemas digestivos. 
                      Uma transição gradual permite que o sistema digestivo do seu cão se adapte aos novos alimentos.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="font-semibold text-green-600">Mais saudável</p>
                    <p className="text-muted-foreground">Melhor digestão</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="font-semibold text-blue-600">Menos riscos</p>
                    <p className="text-muted-foreground">Evita vômitos</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="font-semibold text-amber-600">Identificação</p>
                    <p className="text-muted-foreground">De intolerâncias</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Speed selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Escolha a velocidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(TRANSITION_SPEEDS).map(([key, speed]) => {
                  const Icon = speed.icon;
                  const isSelected = selectedSpeed === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSpeed(key as keyof typeof TRANSITION_SPEEDS)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{speed.name}</span>
                            <Badge variant="outline" className="text-xs">{speed.days} dias</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{speed.description}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Button className="w-full gap-2" onClick={() => setShowChecklist(true)}>
              <Play className="w-4 h-4" />
              Continuar
            </Button>
          </>
        )}

        {/* Checklist before starting */}
        {!transition && showChecklist && (
          <>
            <Button variant="ghost" onClick={() => setShowChecklist(false)} className="mb-2">
              ← Voltar
            </Button>
            <TransitionChecklist onStart={startTransition} />
          </>
        )}

        {/* Active transition */}
        {transition && currentSchedule && (
          <>
            {/* Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Progresso de {selectedDog?.name}</span>
                  <Badge variant="secondary">Dia {transition.current_day}/{transition.total_days}</Badge>
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

            {/* Calculator with real portions */}
            <TransitionCalculator
              metaGramasDia={selectedDog?.meta_gramas_dia || null}
              kibblePercentage={currentSchedule.kibble}
              naturalPercentage={currentSchedule.natural}
            />

            {/* Food guide */}
            <TransitionFoodGuide currentDay={transition.current_day} />

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

                {/* Smart alerts based on symptoms */}
                {selectedSymptoms.length > 0 && (
                  <TransitionAlerts 
                    symptoms={selectedSymptoms} 
                    dayNumber={transition.current_day}
                    consecutiveIssues={consecutiveIssues}
                  />
                )}

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

            {/* Day tip */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Dica do dia {transition.current_day}</p>
                    <p className="text-muted-foreground">{currentTip}</p>
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

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-sm text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Este guia é uma sugestão baseada em boas práticas. Se seu cão tiver problemas de saúde, 
            consulte um médico-veterinário antes de iniciar a transição.
          </p>
        </div>

        <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="dietary_transition" />
      </div>
    </AppLayout>
  );
}
