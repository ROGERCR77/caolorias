import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dog, DogObjetivo, NivelAtividade, CondicaoCorporal, DogSex, BreedReference, calculateRER, calculateMER, calculateMetaGramasDia } from "@/contexts/DataContext";
import { Calculator, Target, Info, Scale, AlertTriangle, Crown, Loader2, ChevronLeft, ChevronRight, Check, Dog as DogIcon, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BreedCombobox } from "@/components/app/BreedCombobox";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { useAuth } from "@/contexts/AuthContext";
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

const sexLabels: Record<DogSex, string> = {
  macho: "Macho",
  femea: "Fêmea",
};

const sizeLabels: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  giant: "Gigante",
};

export interface DogFormData {
  name: string;
  breed: string;
  birth_date: string;
  current_weight_kg: string;
  size: Dog["size"];
  sex: DogSex;
  feeding_type: Dog["feeding_type"];
  objetivo: DogObjetivo;
  nivel_atividade: NivelAtividade;
  condicao_corporal: CondicaoCorporal;
  meta_kcal_dia: string;
  meta_gramas_dia: string;
  photo_url: string;
}

interface DogFormWizardProps {
  editingDog: Dog | null;
  onSubmit: (data: DogFormData) => Promise<void>;
  onCancel: () => void;
  getBreedByName: (name: string) => BreedReference | undefined;
}

const STEPS = [
  { id: 1, title: "Nome", icon: DogIcon },
  { id: 2, title: "Raça", icon: Scale },
  { id: 3, title: "Dados", icon: Info },
  { id: 4, title: "Perfil", icon: Target },
  { id: 5, title: "Metas", icon: Calculator },
];

export function DogFormWizard({ editingDog, onSubmit, onCancel, getBreedByName }: DogFormWizardProps) {
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [selectedBreedRef, setSelectedBreedRef] = useState<BreedReference | null>(
    editingDog?.breed ? getBreedByName(editingDog.breed) || null : null
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(editingDog?.photo_url || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<DogFormData>({
    name: editingDog?.name || "",
    breed: editingDog?.breed || "",
    birth_date: editingDog?.birth_date || "",
    current_weight_kg: editingDog?.current_weight_kg?.toString() || "",
    size: editingDog?.size || "medium",
    sex: editingDog?.sex || "macho",
    feeding_type: editingDog?.feeding_type || "natural",
    objetivo: editingDog?.objetivo || "manter_peso",
    nivel_atividade: editingDog?.nivel_atividade || "moderada",
    condicao_corporal: editingDog?.condicao_corporal || "ideal",
    meta_kcal_dia: editingDog?.meta_kcal_dia?.toString() || "",
    meta_gramas_dia: editingDog?.meta_gramas_dia?.toString() || "",
    photo_url: editingDog?.photo_url || "",
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

    toast({ title: "Meta calculada!", description: `${metaKcal} kcal / ${metaGramas}g por dia` });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setPhotoFile(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setFormData({ ...formData, photo_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return formData.photo_url || null;

    setIsUploadingPhoto(true);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(photoFile, 800, 0.8);
      
      const fileExt = "jpg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("dog-photos")
        .upload(fileName, compressedFile, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("dog-photos")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ title: "Erro ao enviar foto", description: "Tente novamente.", variant: "destructive" });
      return formData.photo_url || null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          toast({
            title: "Nome obrigatório",
            description: "Por favor, informe o nome do cão.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection(-1);
      setCurrentStep(step);
    } else if (step > currentStep && validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < 5 && validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
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
      // Upload photo if selected
      const photoUrl = await uploadPhoto();
      await onSubmit({ ...formData, photo_url: photoUrl || "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNaturalFeedingWarning = formData.feeding_type === "natural" || formData.feeding_type === "mixed";

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col h-full min-h-[60vh]">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 pb-6 px-4">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(step.id)}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all",
              currentStep === step.id
                ? "bg-primary text-primary-foreground scale-110"
                : currentStep > step.id
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {currentStep > step.id ? (
              <Check className="w-4 h-4" />
            ) : (
              <step.icon className="w-4 h-4" />
            )}
          </button>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center pb-4">
        <h2 className="text-lg font-semibold">{STEPS[currentStep - 1].title}</h2>
        <p className="text-sm text-muted-foreground">
          Passo {currentStep} de {STEPS.length}
        </p>
      </div>

      {/* Step Content - scrollable for keyboard */}
      <div className="flex-1 overflow-y-auto keyboard-scroll-container relative px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="pb-[120px]"
          >
            {/* Step 1: Nome + Foto */}
            {currentStep === 1 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                {/* Photo Upload */}
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isUploadingPhoto}
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center transition-all overflow-hidden",
                      "border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10",
                      photoPreview && "border-solid border-primary"
                    )}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="w-8 h-8 text-primary" />
                        <span className="text-[10px] text-muted-foreground">Foto</span>
                      </div>
                    )}
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="w-full max-w-sm space-y-2">
                  <Label htmlFor="name" className="text-center block text-base">
                    Como ele(a) se chama?
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Rex, Luna, Thor..."
                    disabled={isSubmitting}
                    className="h-14 text-center text-lg"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 2: Raça */}
            {currentStep === 2 && (
              <div className="flex flex-col h-full space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">Qual a raça de {formData.name || "seu cão"}?</Label>
                  <BreedCombobox
                    value={formData.breed}
                    onChange={handleBreedChange}
                    disabled={isSubmitting}
                  />
                </div>

                {selectedBreedRef && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <Scale className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">{selectedBreedRef.breed_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Peso típico: {selectedBreedRef.peso_min_kg}–{selectedBreedRef.peso_max_kg} kg
                      </p>
                      {selectedBreedRef.descricao_resumida && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedBreedRef.descricao_resumida}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-sm text-muted-foreground text-center">
                  Não sabe? Deixe em branco ou digite "SRD" (Sem Raça Definida)
                </p>
              </div>
            )}

            {/* Step 3: Dados Básicos */}
            {currentStep === 3 && (
              <div className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="birth_date" className="text-base">Data de nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    disabled={isSubmitting}
                    className="h-14"
                  />
                  <p className="text-xs text-muted-foreground">Aproximada, se não souber exato</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-base">Peso atual (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={formData.current_weight_kg}
                    onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                    placeholder="Ex: 12.5"
                    disabled={isSubmitting}
                    className="h-14 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Sexo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(sexLabels).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, sex: value as DogSex })}
                        className={cn(
                          "h-14 rounded-xl border-2 font-medium transition-all",
                          formData.sex === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {value === "macho" ? "♂" : "♀"} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Características */}
            {currentStep === 4 && (
              <div className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <Label className="text-base">Porte</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(sizeLabels).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, size: value as Dog["size"] })}
                        className={cn(
                          "h-12 rounded-xl border-2 font-medium transition-all",
                          formData.size === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Tipo de alimentação</Label>
                  <div className="space-y-2">
                    {Object.entries(feedingTypeLabels).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, feeding_type: value as Dog["feeding_type"] })}
                        className={cn(
                          "w-full h-14 rounded-xl border-2 font-medium transition-all flex items-center justify-between px-4",
                          formData.feeding_type === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span>{label}</span>
                        <span className="text-sm text-muted-foreground">{feedingTypeDescriptions[value]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {showNaturalFeedingWarning && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Alimentação natural exige cardápio balanceado. Consulte um veterinário nutrólogo.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Metas */}
            {currentStep === 5 && (
              <div className="flex flex-col space-y-5">
                <div className="space-y-2">
                  <Label className="text-base">Objetivo</Label>
                  <Select
                    value={formData.objetivo}
                    onValueChange={(v) => setFormData({ ...formData, objetivo: v as DogObjetivo })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-14">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Atividade</Label>
                    <Select
                      value={formData.nivel_atividade}
                      onValueChange={(v) => setFormData({ ...formData, nivel_atividade: v as NivelAtividade })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-12">
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
                    <Label className="text-sm">Condição corporal</Label>
                    <Select
                      value={formData.condicao_corporal}
                      onValueChange={(v) => setFormData({ ...formData, condicao_corporal: v as CondicaoCorporal })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-12">
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
                  className="w-full h-12"
                  onClick={handleCalculateMeta}
                  disabled={isSubmitting}
                >
                  <Calculator className="w-4 h-4" />
                  Calcular meta automática
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="meta_kcal" className="text-sm">Meta kcal/dia</Label>
                    <Input
                      id="meta_kcal"
                      type="number"
                      inputMode="numeric"
                      value={formData.meta_kcal_dia}
                      onChange={(e) => setFormData({ ...formData, meta_kcal_dia: e.target.value })}
                      placeholder="500"
                      disabled={isSubmitting}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_gramas" className="text-sm">Meta g/dia</Label>
                    <Input
                      id="meta_gramas"
                      type="number"
                      inputMode="numeric"
                      value={formData.meta_gramas_dia}
                      onChange={(e) => setFormData({ ...formData, meta_gramas_dia: e.target.value })}
                      placeholder="300"
                      disabled={isSubmitting}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs">
                  <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Estimativas gerais. Consulte um veterinário para orientação personalizada.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-6 px-4 pb-safe">
        {currentStep === 1 ? (
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 h-12" 
            onClick={onCancel} 
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 h-12" 
            onClick={prevStep} 
            disabled={isSubmitting}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        )}
        
        {currentStep < 5 ? (
          <Button 
            type="button" 
            className="flex-1 h-12" 
            onClick={nextStep} 
            disabled={isSubmitting}
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="accent" 
            className="flex-1 h-12" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Check className="w-4 h-4" />
                Salvar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}