import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData, DogPorte, NivelAtividade } from "@/contexts/DataContext";
import { Plus, Trash2, Scale, TrendingUp, TrendingDown, Minus, Dog, Loader2, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BreedReferenceCard } from "@/components/app/BreedReferenceCard";
import { ActivityReferenceCard } from "@/components/app/ActivityReferenceCard";

const sizeToPorte: Record<string, DogPorte> = {
  small: "pequeno",
  medium: "medio",
  large: "grande",
  giant: "gigante",
};

const WeightProgress = () => {
  const { dogs, weightLogs, selectedDogId, addWeightLog, deleteWeightLog, isLoading: dataLoading, getBreedByName, getActivityReference } = useData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    weightKg: "",
  });

  const selectedDog = dogs.find((d) => d.id === selectedDogId);

  // Get breed reference for selected dog
  const breedRef = selectedDog?.breed ? getBreedByName(selectedDog.breed) : undefined;
  
  // Get activity reference for selected dog
  const porte = selectedDog ? sizeToPorte[selectedDog.size] : undefined;
  const activityRef = porte && selectedDog?.nivel_atividade 
    ? getActivityReference(porte, selectedDog.nivel_atividade as NivelAtividade) 
    : undefined;

  // Get weight logs for selected dog
  const dogWeightLogs = weightLogs
    .filter((w) => w.dog_id === selectedDogId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate weight trend
  const getWeightTrend = () => {
    if (dogWeightLogs.length < 2) return null;
    const latest = dogWeightLogs[dogWeightLogs.length - 1].weight_kg;
    const previous = dogWeightLogs[dogWeightLogs.length - 2].weight_kg;
    const diff = Number(latest) - Number(previous);
    return { diff, isUp: diff > 0, isDown: diff < 0 };
  };

  const weightTrend = getWeightTrend();

  // Prepare chart data
  const chartData = dogWeightLogs.map((log) => ({
    date: format(parseISO(log.date), "dd/MM"),
    peso: Number(log.weight_kg),
    fullDate: log.date,
  }));

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      weightKg: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDogId) {
      toast({
        title: "Selecione um cão",
        description: "Por favor, selecione um cão primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.weightKg) {
      toast({
        title: "Peso obrigatório",
        description: "Por favor, informe o peso do cão.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addWeightLog({
        dog_id: selectedDogId,
        date: formData.date,
        weight_kg: parseFloat(formData.weightKg),
      });

      toast({
        title: "Peso registrado!",
        description: `${formData.weightKg} kg registrado para ${selectedDog?.name}.`,
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Algo deu errado",
        description: "Tente novamente. Se o problema continuar, entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (confirm("Tem certeza que deseja remover esse registro de peso?")) {
      try {
        await deleteWeightLog(logId);
        toast({
          title: "Registro removido",
          description: "O registro de peso foi removido.",
        });
      } catch (error: any) {
        toast({
          title: "Algo deu errado",
          description: "Tente novamente. Se o problema continuar, entre em contato com o suporte.",
          variant: "destructive",
        });
      }
    }
  };

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (dogs.length === 0) {
    return (
      <AppLayout>
        <div className="container px-4 py-8">
          <Card variant="elevated" className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
                <Dog className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Cadastre um cão primeiro</h2>
              <p className="text-muted-foreground mb-6">
                Para registrar o peso, você precisa ter pelo menos um cão cadastrado.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link to="/app/caes">
                  <Plus className="w-4 h-4" />
                  Cadastrar meu cão
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container px-4 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Peso & Progresso</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="accent">
                  <Plus className="w-4 h-4" />
                  Registrar peso
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm bg-card">
                <DialogHeader>
                  <DialogTitle>Registrar novo peso</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      placeholder="Ex: 12.5"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="accent" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar peso"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DogSelector className="w-full sm:max-w-48" />
        </div>

        {selectedDog && (
          <div className="space-y-4">
            {/* Current weight card */}
            <Card variant="gradient">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Peso atual de {selectedDog.name}</p>
                    <p className="text-4xl font-bold text-primary">{selectedDog.current_weight_kg} kg</p>
                    {weightTrend && (
                      <div className="flex items-center gap-1 mt-2">
                        {weightTrend.isUp ? (
                          <TrendingUp className="w-4 h-4 text-warning" />
                        ) : weightTrend.isDown ? (
                          <TrendingDown className="w-4 h-4 text-success" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className={`text-sm font-medium ${
                          weightTrend.isUp ? "text-warning" : weightTrend.isDown ? "text-success" : "text-muted-foreground"
                        }`}>
                          {weightTrend.diff > 0 ? "+" : ""}{weightTrend.diff.toFixed(1)} kg desde a última pesagem
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-full bg-primary-light">
                    <Scale className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weight change warning */}
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    A evolução do peso é apenas um dos sinais de saúde. Mudanças rápidas (para mais ou para menos) merecem a atenção de um veterinário.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Weight chart */}
            {chartData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução do peso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 12 }}
                          domain={['dataMin - 0.5', 'dataMax + 0.5']}
                          tickFormatter={(value) => `${value}kg`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [`${value} kg`, "Peso"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="peso"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: "hsl(var(--accent))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Chart help text */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Use essa curva de peso para conversar com o médico-veterinário sobre a alimentação natural, quantidade de comida e rotina de exercícios de {selectedDog.name}. O gráfico não serve para diagnóstico, e sim para apoiar a avaliação profissional.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weight history */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de pesagens</CardTitle>
              </CardHeader>
              <CardContent>
                {dogWeightLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum peso registrado ainda. Clique em "Registrar peso" para começar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {[...dogWeightLogs].reverse().map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                      >
                        <div>
                          <p className="font-semibold">{log.weight_kg} kg</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(log.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breed reference card */}
            {breedRef && (
              <BreedReferenceCard
                breed={breedRef}
                currentWeight={selectedDog?.current_weight_kg}
                dogName={selectedDog?.name}
              />
            )}

            {/* No breed reference */}
            {selectedDog && !breedRef && selectedDog.breed && (
              <Card variant="elevated">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Ainda não temos uma referência de peso típica para a raça "{selectedDog.breed}". 
                    Você pode <Link to="/app/racas" className="text-primary hover:underline">consultar outras raças</Link> ou 
                    falar com um veterinário para entender a condição corporal ideal de {selectedDog.name}.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Activity reference card */}
            {activityRef && porte && selectedDog?.nivel_atividade && (
              <ActivityReferenceCard
                activity={activityRef}
                dogName={selectedDog.name}
                porte={porte}
                energia={selectedDog.nivel_atividade}
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WeightProgress;
