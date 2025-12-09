import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dog, DogObjetivo, NivelAtividade, CondicaoCorporal, BreedReference, calculateRER, calculateMER, calculateMetaGramasDia } from "@/contexts/DataContext";
import { Calculator, Target, Info, Scale, AlertTriangle, Crown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BreedCombobox } from "@/components/app/BreedCombobox";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  natural: "Comida preparada em casa",
  kibble: "Ração seca ou úmida",
  mixed: "Ração + alimentação natural",
};

const objetivoLabels: Record<DogObjetivo, string> = {
  manter_peso: "Manter peso",
  perder_peso: "Perder peso",
  ganhar_peso: "Ganhar peso",
  alimentacao_saudavel: "Alimentação saudável",
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
  magro: "Costelas visíveis",
  ideal: "Costelas palpáveis",
  acima_peso: "Costelas difíceis de sentir",
};

interface DogFormData {
  name: string;
  breed: string;
  birth_date: string;
  current_weight_kg: string;
  size: Dog["size"];
  feeding_type: Dog["feeding_type"];
  objetivo: DogObjetivo;
  nivel_atividade: NivelAtividade;
  condicao_corporal: CondicaoCorporal;
  meta_kcal_dia: string;
  meta_gramas_dia: string;
}

interface DogFormProps {
  editingDog: Dog | null;
  onSubmit: (data: DogFormData) => Promise<void>;
  onCancel: () => void;
  getBreedByName: (name: string) => BreedReference | undefined;
}

export function DogForm({ editingDog, onSubmit, onCancel, getBreedByName }: DogFormProps) {
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBreedRef, setSelectedBreedRef] = useState<BreedReference | null>(
    editingDog?.breed ? getBreedByName(editingDog.breed) || null : null
  );
  const [goalsOpen, setGoalsOpen] = useState(true);

  const [formData, setFormData] = useState<DogFormData>({
    name: editingDog?.name || "",
    breed: editingDog?.breed || "",
    birth_date: editingDog?.birth_date || "",
    current_weight_kg: editingDog?.current_weight_kg?.toString() || "",
    size: editingDog?.size || "medium",
    feeding_type: editingDog?.feeding_type || "natural",
    objetivo: editingDog?.objetivo || "manter_peso",
    nivel_atividade: editingDog?.nivel_atividade || "moderada",
    condicao_corporal: editingDog?.condicao_corporal || "ideal",
    meta_kcal_dia: editingDog?.meta_kcal_dia?.toString() || "",
    meta_gramas_dia: editingDog?.meta_gramas_dia?.toString() || "",
  });

  const premiumObjectives: DogObjetivo[] = ["manter_peso", "perder_peso", "ganhar_peso"];

  const handleBreedChange = (breedName: string, breedRef?: BreedReference) => {
    setFormData((prev) => ({
      ...prev,
      breed: breedName,
      ...(breedRef && !editingDog ? { size: porteToSize[breedRef.porte] as Dog["size"] } : {}),
    }));
    setSelectedBreedRef(breedRef || null);
  };

  const handleCalculateMeta = () => {
    const weight = parseFloat(formData.current_weight_kg);
    if (!weight || weight <= 0) {
      toast({
        title: "Peso necessário",
        description: "Informe o peso do cão para calcular.",
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
      description: `${metaKcal} kcal / ${metaGramas}g por dia`,
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
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNaturalFeedingWarning = formData.feeding_type === "natural" || formData.feeding_type === "mixed";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Rex, Luna..."
            disabled={isSubmitting}
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="breed" className="text-sm">Raça</Label>
          <BreedCombobox
            value={formData.breed}
            onChange={handleBreedChange}
            disabled={isSubmitting}
          />
        </div>

        {selectedBreedRef && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs">
            <Scale className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
            <p className="text-foreground">
              <span className="font-medium">{selectedBreedRef.breed_name}</span>: {selectedBreedRef.peso_min_kg}–{selectedBreedRef.peso_max_kg} kg típico
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="birth_date" className="text-sm">Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              disabled={isSubmitting}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weight" className="text-sm">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.current_weight_kg}
              onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
              placeholder="Ex: 12.5"
              disabled={isSubmitting}
              className="h-11"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Porte</Label>
            <Select
              value={formData.size}
              onValueChange={(v) => setFormData({ ...formData, size: v as Dog["size"] })}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-11">
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

          <div className="space-y-1.5">
            <Label className="text-sm">Alimentação</Label>
            <Select
              value={formData.feeding_type}
              onValueChange={(v) => setFormData({ ...formData, feeding_type: v as Dog["feeding_type"] })}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {Object.entries(feedingTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span>{label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showNaturalFeedingWarning && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-700 dark:text-yellow-400">
              Alimentação natural exige cardápio balanceado. Consulte um veterinário nutrólogo.
            </p>
          </div>
        )}
      </div>

      {/* Goals Section - Collapsible */}
      <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen} className="border-t pt-3">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Metas do Cãolorias</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 transition-transform", goalsOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Objetivo</Label>
            <Select
              value={formData.objetivo}
              onValueChange={(v) => setFormData({ ...formData, objetivo: v as DogObjetivo })}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-11">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Atividade</Label>
              <Select
                value={formData.nivel_atividade}
                onValueChange={(v) => setFormData({ ...formData, nivel_atividade: v as NivelAtividade })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {Object.entries(nivelAtividadeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Condição corporal</Label>
              <Select
                value={formData.condicao_corporal}
                onValueChange={(v) => setFormData({ ...formData, condicao_corporal: v as CondicaoCorporal })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {Object.entries(condicaoCorporalLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleCalculateMeta}
            disabled={isSubmitting}
          >
            <Calculator className="w-4 h-4" />
            Calcular meta automática
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="meta_kcal" className="text-sm">Meta kcal/dia</Label>
              <Input
                id="meta_kcal"
                type="number"
                value={formData.meta_kcal_dia}
                onChange={(e) => setFormData({ ...formData, meta_kcal_dia: e.target.value })}
                placeholder="500"
                disabled={isSubmitting}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meta_gramas" className="text-sm">Meta g/dia</Label>
              <Input
                id="meta_gramas"
                type="number"
                value={formData.meta_gramas_dia}
                onChange={(e) => setFormData({ ...formData, meta_gramas_dia: e.target.value })}
                placeholder="300"
                disabled={isSubmitting}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-xs">
            <Info className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground">
              Estimativas gerais. Consulte um veterinário para orientação personalizada.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Buttons - Sticky */}
      <div className="flex gap-3 pt-3 sticky bottom-0 bg-background pb-safe">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1 h-11" 
          onClick={onCancel} 
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="accent" 
          className="flex-1 h-11" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
