import { useState, useRef } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, subDays, parseISO, differenceInYears, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, FileText, Download, Share2, Dog as DogIcon,
  Scale, Utensils, Activity, Heart, Crown, Printer
} from "lucide-react";
import { UpgradeModal } from "@/components/app/UpgradeModal";

export default function VetReport() {
  const { user } = useAuth();
  const { selectedDogId, dogs, meals, weightLogs, foods, isLoading: dataLoading } = useData();
  const { isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Calculate dog age
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "Não informado";
    const birth = parseISO(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    if (years > 0) return `${years} ano${years > 1 ? 's' : ''} e ${months} mês${months !== 1 ? 'es' : ''}`;
    return `${months} mês${months !== 1 ? 'es' : ''}`;
  };

  // Load health data
  const loadHealthData = async () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    
    if (!user || !selectedDogId) return;
    
    setIsLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const [symptomsRes, poopRes, energyRes, activityRes, intolerancesRes] = await Promise.all([
        supabase.from('health_symptoms').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('poop_logs').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('energy_logs').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('activity_logs').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('food_intolerances').select('*').eq('dog_id', selectedDogId),
      ]);

      setHealthData({
        symptoms: symptomsRes.data || [],
        poopLogs: poopRes.data || [],
        energyLogs: energyRes.data || [],
        activityLogs: activityRes.data || [],
        intolerances: intolerancesRes.data || [],
      });
      
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Print report
  const printReport = () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    window.print();
  };

  // Get recent meals
  const recentMeals = meals
    .filter(m => m.dog_id === selectedDogId)
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
    .slice(0, 10);

  // Get weight history
  const recentWeights = weightLogs
    .filter(w => w.dog_id === selectedDogId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Calculate averages
  const avgMealKcal = recentMeals.length > 0 
    ? Math.round(recentMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0) / recentMeals.length)
    : 0;

  if (dataLoading) {
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
      <div className="space-y-4 pb-24 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Relatório para Veterinário</h1>
            <p className="text-sm text-muted-foreground">Exporte os dados do seu cão</p>
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
                  Assine para exportar relatórios completos
                </p>
              </div>
              <Button size="sm" onClick={() => setShowUpgrade(true)}>
                Assinar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 gap-2" 
            onClick={loadHealthData}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Gerar Relatório
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={printReport}
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {/* Report Preview */}
        <div ref={reportRef} className="space-y-4 print:p-4" id="vet-report">
          {/* Dog Info */}
          {selectedDog && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DogIcon className="h-4 w-4" />
                  Dados do Pet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-semibold">{selectedDog.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Raça</p>
                    <p className="font-semibold">{selectedDog.breed || "SRD"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Idade</p>
                    <p className="font-semibold">{calculateAge(selectedDog.birth_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peso Atual</p>
                    <p className="font-semibold">{selectedDog.current_weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Porte</p>
                    <p className="font-semibold capitalize">{selectedDog.size}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Alimentação</p>
                    <p className="font-semibold capitalize">{selectedDog.feeding_type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weight History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Histórico de Peso (últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentWeights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registros</p>
              ) : (
                <div className="space-y-1">
                  {recentWeights.slice(0, 5).map(w => (
                    <div key={w.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(parseISO(w.date), "dd/MM/yyyy")}
                      </span>
                      <span className="font-semibold">{w.weight_kg} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feeding Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Resumo Alimentar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Meta diária</p>
                  <p className="font-semibold">{selectedDog?.meta_kcal_dia || '-'} kcal</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Média consumida</p>
                  <p className="font-semibold">{avgMealKcal} kcal</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Objetivo</p>
                  <p className="font-semibold capitalize">{selectedDog?.objetivo?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Refeições registradas</p>
                  <p className="font-semibold">{recentMeals.length} (30 dias)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Data (if loaded) */}
          {healthData && (
            <>
              {/* Intolerances */}
              {healthData.intolerances.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Alergias/Intolerâncias Registradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {healthData.intolerances.map((i: any) => (
                        <Badge key={i.id} variant="destructive">
                          {i.food_name || foods.find(f => f.id === i.food_id)?.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Symptoms */}
              {healthData.symptoms.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sintomas Registrados (30 dias)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {healthData.symptoms.slice(0, 5).map((s: any) => (
                        <div key={s.id} className="flex justify-between text-sm">
                          <span>{s.symptoms?.join(', ')}</span>
                          <span className="text-muted-foreground">
                            {format(parseISO(s.logged_at), "dd/MM")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Activity Summary */}
              {healthData.activityLogs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Atividade Física (30 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total atividades</p>
                        <p className="font-semibold">{healthData.activityLogs.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tempo total</p>
                        <p className="font-semibold">
                          {healthData.activityLogs.reduce((sum: number, a: any) => sum + a.duration_minutes, 0)} min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Report footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>Relatório gerado pelo Cãolorias em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p className="mt-1">Este relatório é apenas informativo e não substitui avaliação veterinária.</p>
          </div>
        </div>
        
        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature="pdf_export"
        />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #vet-report, #vet-report * { visibility: visible; }
          #vet-report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </AppLayout>
  );
}
