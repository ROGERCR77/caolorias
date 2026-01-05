import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FoodIntolerance {
  id: string;
  dog_id: string;
  food_id: string | null;
  food_name: string | null;
  reaction_type: string;
  symptoms: string[] | null;
  notes: string | null;
}

const REACTION_TYPES = [
  { value: 'alergia', label: '🚨 Alergia', color: 'text-red-500' },
  { value: 'intolerancia', label: '⚠️ Intolerância', color: 'text-yellow-500' },
  { value: 'nao_gostou', label: '👎 Não gostou', color: 'text-muted-foreground' },
];

const SYMPTOMS_LIST = [
  { value: 'coceira', label: '🐾 Coceira' },
  { value: 'diarreia', label: '💧 Diarreia' },
  { value: 'vomito', label: '🤢 Vômito' },
  { value: 'vermelhidao', label: '🔴 Vermelhidão' },
  { value: 'inchaço', label: '😶 Inchaço' },
  { value: 'apatia', label: '😔 Apatia' },
];

interface FoodIntolerancesCardProps {
  dogId: string;
}

export function FoodIntolerancesCard({ dogId }: FoodIntolerancesCardProps) {
  const { user } = useAuth();
  const { foods } = useData();
  const [intolerances, setIntolerances] = useState<FoodIntolerance[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [customFoodName, setCustomFoodName] = useState('');
  const [reactionType, setReactionType] = useState('intolerancia');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Fetch intolerances
  useEffect(() => {
    if (!user || !dogId) return;
    
    const fetch = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('food_intolerances')
        .select('*')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: false });

      if (data) setIntolerances(data);
      setIsLoading(false);
    };

    fetch();
  }, [user, dogId]);

  const saveIntolerance = async () => {
    if (!user || !dogId) return;
    
    const foodName = selectedFoodId 
      ? foods.find(f => f.id === selectedFoodId)?.name 
      : customFoodName;
    
    if (!foodName) {
      toast.error('Selecione ou digite um alimento');
      return;
    }

    try {
      const { error } = await supabase.from('food_intolerances').insert({
        dog_id: dogId,
        user_id: user.id,
        food_id: selectedFoodId || null,
        food_name: selectedFoodId ? null : customFoodName,
        reaction_type: reactionType,
        symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : null,
      });

      if (error) throw error;

      toast.success('Intolerância registrada!');
      setDialogOpen(false);
      resetForm();
      
      const { data } = await supabase
        .from('food_intolerances')
        .select('*')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: false });
      if (data) setIntolerances(data);
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const deleteIntolerance = async (id: string) => {
    try {
      const { error } = await supabase.from('food_intolerances').delete().eq('id', id);
      if (error) throw error;
      setIntolerances(prev => prev.filter(i => i.id !== id));
      toast.success('Removido');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setSelectedFoodId('');
    setCustomFoodName('');
    setReactionType('intolerancia');
    setSelectedSymptoms([]);
  };

  const getFoodDisplayName = (intolerance: FoodIntolerance) => {
    if (intolerance.food_id) {
      return foods.find(f => f.id === intolerance.food_id)?.name || 'Alimento';
    }
    return intolerance.food_name || 'Alimento';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Alimentos a Evitar
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Adicionar Intolerância</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
                {/* Food selection */}
                <div>
                  <p className="text-sm font-medium mb-2">Alimento</p>
                  <Select value={selectedFoodId} onValueChange={setSelectedFoodId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um alimento cadastrado" />
                    </SelectTrigger>
                    <SelectContent>
                      {foods.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground my-2">ou</p>
                  <Input 
                    placeholder="Digite o nome do alimento"
                    value={customFoodName}
                    onChange={(e) => {
                      setCustomFoodName(e.target.value);
                      setSelectedFoodId('');
                    }}
                    disabled={!!selectedFoodId}
                  />
                </div>

                {/* Reaction type */}
                <div>
                  <p className="text-sm font-medium mb-2">Tipo de reação</p>
                  <div className="flex flex-wrap gap-2">
                    {REACTION_TYPES.map(r => (
                      <Button
                        key={r.value}
                        variant={reactionType === r.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReactionType(r.value)}
                      >
                        {r.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <p className="text-sm font-medium mb-2">Sintomas (opcional)</p>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS_LIST.map(s => (
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

                <Button className="w-full" onClick={saveIntolerance}>
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : intolerances.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum alimento marcado. Adicione alimentos que causam reações.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {intolerances.map(intolerance => {
              const reactionInfo = REACTION_TYPES.find(r => r.value === intolerance.reaction_type);
              return (
                <Badge 
                  key={intolerance.id} 
                  variant="secondary"
                  className={`gap-1 pr-1 ${reactionInfo?.color}`}
                >
                  {getFoodDisplayName(intolerance)}
                  <button 
                    onClick={() => deleteIntolerance(intolerance.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
