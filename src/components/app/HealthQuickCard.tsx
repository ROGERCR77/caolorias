import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Zap, 
  Heart, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

const ENERGY_QUICK = [
  { value: 'muito_agitado', label: '🚀', title: 'Agitado' },
  { value: 'normal', label: '😊', title: 'Normal' },
  { value: 'muito_quieto', label: '😴', title: 'Quieto' },
];

export function HealthQuickCard() {
  const { user } = useAuth();
  const { selectedDogId, dogs } = useData();
  const navigate = useNavigate();
  const [todayEnergy, setTodayEnergy] = useState<string | null>(null);
  const [healthAlert, setHealthAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Check today's energy and recent health issues
  useEffect(() => {
    if (!user || !selectedDogId) return;

    const checkTodayStatus = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [energyRes, symptomsRes, poopRes] = await Promise.all([
        supabase
          .from('energy_logs')
          .select('energy_level')
          .eq('dog_id', selectedDogId)
          .gte('logged_at', today.toISOString())
          .order('logged_at', { ascending: false })
          .limit(1),
        supabase
          .from('health_symptoms')
          .select('id')
          .eq('dog_id', selectedDogId)
          .gte('logged_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1),
        supabase
          .from('poop_logs')
          .select('texture, has_blood, has_mucus')
          .eq('dog_id', selectedDogId)
          .gte('logged_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
          .or('texture.eq.diarreia,has_blood.eq.true,has_mucus.eq.true')
          .limit(1),
      ]);

      if (energyRes.data && energyRes.data.length > 0) {
        setTodayEnergy(energyRes.data[0].energy_level);
      }

      // Check for health alerts
      const hasSymptoms = symptomsRes.data && symptomsRes.data.length > 0;
      const hasPoopIssues = poopRes.data && poopRes.data.length > 0;
      setHealthAlert(hasSymptoms || hasPoopIssues);
    };

    checkTodayStatus();
  }, [user, selectedDogId]);

  const saveQuickEnergy = async (energy: string) => {
    if (!user || !selectedDogId || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('energy_logs').insert({
        dog_id: selectedDogId,
        user_id: user.id,
        energy_level: energy,
      });

      if (error) throw error;
      setTodayEnergy(energy);
      toast.success('Energia registrada!');
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDog) return null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Energy Quick Register */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Como está {selectedDog.name}?</span>
          </div>
          {todayEnergy && (
            <Badge variant="secondary" className="text-xs">
              Registrado hoje
            </Badge>
          )}
        </div>

        {!todayEnergy ? (
          <div className="flex gap-2">
            {ENERGY_QUICK.map(e => (
              <Button
                key={e.value}
                variant="outline"
                size="sm"
                className="flex-1 flex-col h-auto py-2"
                onClick={() => saveQuickEnergy(e.value)}
                disabled={isLoading}
              >
                <span className="text-lg">{e.label}</span>
                <span className="text-[10px]">{e.title}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>
              {ENERGY_QUICK.find(e => e.value === todayEnergy)?.label}{' '}
              {ENERGY_QUICK.find(e => e.value === todayEnergy)?.title}
            </span>
          </div>
        )}

        {/* Health Alert */}
        {healthAlert && (
          <div 
            className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg cursor-pointer"
            onClick={() => navigate('/app/saude-digestiva')}
          >
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-yellow-700 dark:text-yellow-300">
              Sinais de atenção nos últimos 3 dias
            </span>
          </div>
        )}

        {/* Link to full health page */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full gap-2 text-xs"
          onClick={() => navigate('/app/saude-digestiva')}
        >
          <Heart className="h-3 w-3" />
          Ver Saúde Digestiva Completa
        </Button>
      </CardContent>
    </Card>
  );
}
