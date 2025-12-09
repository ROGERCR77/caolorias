import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData, Dog, DogObjetivo, NivelAtividade, CondicaoCorporal, BreedReference, calculateRER, calculateMER, calculateMetaGramasDia } from "@/contexts/DataContext";
import { Plus, Edit2, Trash2, Dog as DogIcon, Loader2, Calculator, Target, Info, Scale, AlertTriangle, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BreedCombobox } from "@/components/app/BreedCombobox";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { usePlanLimits } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/app/UpgradeModal";
import { FoodIntolerancesCard } from "@/components/app/FoodIntolerancesCard";

const sizeLabels: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  giant: "Gigante",
};

const sizeToPorte: Record<string, string> = {
  small: "pequeno",
  medium: "medio",
  large: "grande",
  giant: "gigante",
};

const porteToSize: Record<string, string> = {
  pequeno: "small",
  medio: "medium",
  grande: "large",
  gigante: "giant",
};

const feedingTypeLabels = {
  natural: "Natural",
  kibble: "Ração",
  mixed: "Mista",
};

const feedingTypeDescriptions: Record<string, string> = {
  natural: "Comida preparada em casa ou alimentação natural industrializada.",
  kibble: "Apenas ração seca ou úmida.",
  mixed: "Combinação de ração com alimentação natural.",
};

const objetivoLabels: Record<DogObjetivo, string> = {
  manter_peso: "Manter peso",
  perder_peso: "Perder peso (sobrepeso)",
  ganhar_peso: "Ganhar peso",
  alimentacao_saudavel: "Alimentação mais saudável",
};

const nivelAtividadeLabels: Record<NivelAtividade, string> = {
  baixa: "Baixa",
  moderada: "Moderada",
  alta: "Alta",
};

const condicaoCorporalLabels: Record<CondicaoCorporal, string> = {
  magro: "Magro",
  ideal: "Ideal",
  acima_peso: "Acima do peso",
};

const condicaoCorporalDescriptions: Record<CondicaoCorporal, string> = {
  magro: "Costelas visíveis, pouca gordura",
  ideal: "Costelas palpáveis, cintura visível",
  acima_peso: "Costelas difíceis de sentir, sem cintura",
};

const Dogs = () => {
  const { dogs, addDog, updateDog, deleteDog, isLoading: dataLoading, getBreedByName } = useData();
  const { toast } = useToast();
  const { isPremium, canAccessFeature } = useSubscription();
  const planLimits = usePlanLimits();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBreedRef, setSelectedBreedRef] = useState<BreedReference | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const canAddMoreDogs = dogs.length < planLimits.max_dogs;
  const premiumObjectives: DogObjetivo[] = ["manter_peso", "perder_peso", "ganhar_peso"];

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    birth_date: "",
    current_weight_kg: "",
    size: "medium" as Dog["size"],
    feeding_type: "natural" as Dog["feeding_type"],
    objetivo: "manter_peso" as DogObjetivo,
    nivel_atividade: "moderada" as NivelAtividade,
    condicao_corporal: "ideal" as CondicaoCorporal,
    meta_kcal_dia: "",
    meta_gramas_dia: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      breed: "",
      birth_date: "",
      current_weight_kg: "",
      size: "medium",
      feeding_type: "natural",
      objetivo: "manter_peso",
      nivel_atividade: "moderada",
      condicao_corporal: "ideal",
      meta_kcal_dia: "",
      meta_gramas_dia: "",
    });
    setEditingDog(null);
    setSelectedBreedRef(null);
  };

  const handleBreedChange = (breedName: string, breedRef?: BreedReference) => {
    setFormData((prev) => ({
      ...prev,
      breed: breedName,
      // Auto-fill size if breed reference exists and size hasn't been manually changed
      ...(breedRef && !editingDog ? { size: porteToSize[breedRef.porte] as Dog["size"] } : {}),
    }));
    setSelectedBreedRef(breedRef || null);
  };

  const openNewDogDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDogDialog = (dog: Dog) => {
    setEditingDog(dog);
    setFormData({
      name: dog.name,
      breed: dog.breed || "",
      birth_date: dog.birth_date || "",
      current_weight_kg: dog.current_weight_kg?.toString() || "",
      size: dog.size,
      feeding_type: dog.feeding_type,
      objetivo: dog.objetivo || "manter_peso",
      nivel_atividade: dog.nivel_atividade || "moderada",
      condicao_corporal: dog.condicao_corporal || "ideal",
      meta_kcal_dia: dog.meta_kcal_dia?.toString() || "",
      meta_gramas_dia: dog.meta_gramas_dia?.toString() || "",
    });
    setSelectedBreedRef(dog.breed ? getBreedByName(dog.breed) || null : null);
    setIsDialogOpen(true);
  };

  const handleCalculateMeta = () => {
    const weight = parseFloat(formData.current_weight_kg);
    if (!weight || weight <= 0) {
      toast({
        title: "Peso necessário",
        description: "Informe o peso do cão para calcular a meta.",
        variant: "destructive",
      });
      return;
    }

    const rer = calculateRER(weight);
    const metaKcal = calculateMER(rer, formData.objetivo, formData.condicao_corporal, formData.nivel_atividade);
    const metaGramas = calculateMetaGramasDia(weight, formData.objetivo);

    setFormData({
      ...formData,
      meta_kcal_dia: metaKcal.toString(),
      meta_gramas_dia: metaGramas.toString(),
    });

    toast({
      title: "Meta calculada!",
      description: `Meta diária: ${metaKcal} kcal / ${metaGramas}g`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do cão.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const dogData = {
        name: formData.name.trim(),
        breed: formData.breed.trim(),
        birth_date: formData.birth_date || null,
        current_weight_kg: parseFloat(formData.current_weight_kg) || 0,
        size: formData.size,
        feeding_type: formData.feeding_type,
        objetivo: formData.objetivo,
        nivel_atividade: formData.nivel_atividade,
        condicao_corporal: formData.condicao_corporal,
        meta_kcal_dia: formData.meta_kcal_dia ? parseFloat(formData.meta_kcal_dia) : null,
        meta_gramas_dia: formData.meta_gramas_dia ? parseFloat(formData.meta_gramas_dia) : null,
      };

      if (editingDog) {
        await updateDog(editingDog.id, dogData);
        toast({
          title: "Cão atualizado!",
          description: `${dogData.name} foi atualizado com sucesso.`,
        });
      } else {
        await addDog(dogData);
        toast({
          title: "Cão cadastrado!",
          description: `${dogData.name} foi adicionado! Quanto mais você registrar, mais fácil ficará entender a rotina alimentar dele.`,
        });
      }

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

  const handleDelete = async (dog: Dog) => {
    if (confirm(`Tem certeza que deseja remover ${dog.name}? Todas as refeições e registros de peso serão perdidos.`)) {
      try {
        await deleteDog(dog.id);
        toast({
          title: "Cão removido",
          description: `${dog.name} foi removido.`,
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

  const showNaturalFeedingWarning = formData.feeding_type === "natural" || formData.feeding_type === "mixed";

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Meus cães</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                if (!canAddMoreDogs && !editingDog) {
                  setShowUpgrade(true);
                } else {
                  openNewDogDialog();
                }
              }}>
                <Plus className="w-4 h-4" />
                Adicionar cão
                {!canAddMoreDogs && <Crown className="w-3 h-3 ml-1 text-warning" />}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDog ? "Editar cão" : "Adicionar cão"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Rex, Luna, Thor..."
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breed">Raça</Label>
                  <BreedCombobox
                    value={formData.breed}
                    onChange={handleBreedChange}
                    disabled={isSubmitting}
                  />
                </div>

                {selectedBreedRef && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <Scale className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-foreground">
                        Para a raça <span className="font-medium">{selectedBreedRef.breed_name}</span>, 
                        o peso típico de adultos é de <span className="font-medium">{selectedBreedRef.peso_min_kg} a {selectedBreedRef.peso_max_kg} kg</span>.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Isso é apenas uma referência geral. O mais importante é avaliar a condição corporal com um veterinário.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.current_weight_kg}
                      onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                      placeholder="Ex: 12.5"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Porte</Label>
                    <Select
                      value={formData.size}
                      onValueChange={(v) => setFormData({ ...formData, size: v as Dog["size"] })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                        <SelectItem value="giant">Gigante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de alimentação</Label>
                    <Select
                      value={formData.feeding_type}
                      onValueChange={(v) => setFormData({ ...formData, feeding_type: v as Dog["feeding_type"] })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {Object.entries(feedingTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex flex-col">
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground">
                                {feedingTypeDescriptions[value]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Natural feeding warning */}
                {showNaturalFeedingWarning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <p className="text-yellow-700 dark:text-yellow-400">
                      Alimentação natural é ótima, mas exige cardápio balanceado. Siga sempre a orientação de um médico-veterinário nutrólogo.
                    </p>
                  </div>
                )}

                {/* New goal fields */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Metas do Cãolorias</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Objetivo</Label>
                      <Select
                        value={formData.objetivo}
                        onValueChange={(v) => setFormData({ ...formData, objetivo: v as DogObjetivo })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      <SelectContent className="bg-card">
                          {Object.entries(objetivoLabels).map(([value, label]) => {
                            const isPremiumObjective = premiumObjectives.includes(value as DogObjetivo);
                            const isCurrentValue = editingDog?.objetivo === value;
                            const canUseObjective = isPremium || !isPremiumObjective || isCurrentValue;
                            
                            return (
                              <SelectItem 
                                key={value} 
                                value={value}
                                disabled={!canUseObjective}
                                className={!canUseObjective ? "opacity-50" : ""}
                              >
                                <div className="flex items-center gap-2">
                                  {label}
                                  {!canUseObjective && <Crown className="w-3 h-3 text-warning" />}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Essa meta é apenas uma referência para o Cãolorias sugerir quantidades e insights. Ela não substitui um plano alimentar feito por um veterinário.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Nível de atividade</Label>
                      <Select
                        value={formData.nivel_atividade}
                        onValueChange={(v) => setFormData({ ...formData, nivel_atividade: v as NivelAtividade })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {Object.entries(nivelAtividadeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Condição corporal aproximada</Label>
                      <Select
                        value={formData.condicao_corporal}
                        onValueChange={(v) => setFormData({ ...formData, condicao_corporal: v as CondicaoCorporal })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {Object.entries(condicaoCorporalLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex flex-col">
                                <span>{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {condicaoCorporalDescriptions[value as CondicaoCorporal]}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleCalculateMeta}
                      disabled={isSubmitting}
                    >
                      <Calculator className="w-4 h-4" />
                      Calcular meta automática
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meta_kcal">Meta kcal/dia</Label>
                        <Input
                          id="meta_kcal"
                          type="number"
                          value={formData.meta_kcal_dia}
                          onChange={(e) => setFormData({ ...formData, meta_kcal_dia: e.target.value })}
                          placeholder="Ex: 500"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="meta_gramas">Meta gramas/dia</Label>
                        <Input
                          id="meta_gramas"
                          type="number"
                          value={formData.meta_gramas_dia}
                          onChange={(e) => setFormData({ ...formData, meta_gramas_dia: e.target.value })}
                          placeholder="Ex: 300"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                      <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-muted-foreground">
                        As metas são estimativas gerais. Consulte um veterinário para orientação personalizada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="accent" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar cão"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {dogs.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
                <DogIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Nenhum cão cadastrado</h2>
              <p className="text-muted-foreground mb-4">
                Comece adicionando seu primeiro amigo de quatro patas!
              </p>
              <Button onClick={openNewDogDialog} variant="hero">
                <Plus className="w-4 h-4" />
                Adicionar meu primeiro cão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dogs.map((dog) => (
              <Card key={dog.id} variant="interactive">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                        <DogIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dog.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{dog.breed || "Sem raça definida"}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso atual</span>
                      <span className="font-medium">{dog.current_weight_kg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Porte</span>
                      <span className="font-medium">{sizeLabels[dog.size]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alimentação</span>
                      <span className="font-medium">{feedingTypeLabels[dog.feeding_type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Objetivo</span>
                      <span className="font-medium">{objetivoLabels[dog.objetivo]}</span>
                    </div>
                    {dog.meta_kcal_dia && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meta diária</span>
                        <span className="font-medium text-primary">{dog.meta_kcal_dia} kcal</span>
                      </div>
                    )}
                  </div>

                  {/* Food Intolerances */}
                  <div className="mt-4 pt-4 border-t">
                    <FoodIntolerancesCard dogId={dog.id} />
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDogDialog(dog)}
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(dog)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature="multiple_dogs"
        />
      </div>
    </AppLayout>
  );
};

export default Dogs;
