import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface TreatmentStep {
  title: string;
  description: string;
  target_date: string;
}

interface TreatmentPlanFormProps {
  linkId: string;
  vetUserId: string;
  dogName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function TreatmentPlanForm({
  linkId,
  vetUserId,
  dogName,
  open,
  onOpenChange,
  onSaved,
}: TreatmentPlanFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<TreatmentStep[]>([
    { title: "", description: "", target_date: "" },
  ]);

  const addStep = () => {
    setSteps((prev) => [...prev, { title: "", description: "", target_date: "" }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof TreatmentStep, value: string) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSteps([{ title: "", description: "", target_date: "" }]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Preencha os campos",
        description: "O titulo do plano e obrigatorio.",
        variant: "destructive",
      });
      return;
    }

    const validSteps = steps.filter((step) => step.title.trim());
    if (validSteps.length === 0) {
      toast({
        title: "Adicione etapas",
        description: "Adicione pelo menos uma etapa ao plano.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Insert treatment plan
      const { data: plan, error: planError } = await supabase
        .from("vet_treatment_plans")
        .insert({
          vet_dog_link_id: linkId,
          vet_user_id: vetUserId,
          title: title.trim(),
          description: description.trim() || null,
          status: "active",
        })
        .select()
        .single();

      if (planError) throw planError;

      // 2. Insert treatment steps
      const stepsToInsert = validSteps.map((step, index) => ({
        plan_id: plan.id,
        step_number: index + 1,
        title: step.title.trim(),
        description: step.description.trim() || null,
        target_date: step.target_date || null,
      }));

      const { error: stepsError } = await supabase
        .from("vet_treatment_steps")
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      // 3. Send push notification to tutor
      try {
        const { data: linkData } = await supabase
          .from("vet_dog_links")
          .select("tutor_user_id")
          .eq("id", linkId)
          .single();

        const { data: vetProfile } = await supabase
          .from("vet_profiles")
          .select("name")
          .eq("user_id", vetUserId)
          .single();

        if (linkData?.tutor_user_id) {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: linkData.tutor_user_id,
              title: "Novo plano de tratamento",
              message: `Dr(a). ${vetProfile?.name || "Veterinario"} criou um plano de tratamento para ${dogName}`,
              data: {
                type: "vet_treatment_plan",
                plan_id: plan.id,
              },
            },
          });
        }
      } catch (pushError) {
        console.log("Push notification failed (non-blocking):", pushError);
      }

      toast({ title: "Plano de tratamento salvo!" });
      resetForm();
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel salvar o plano de tratamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Novo Plano de Tratamento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
          <div className="space-y-2">
            <Label htmlFor="plan-title">Titulo</Label>
            <Input
              id="plan-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tratamento dermatologico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-description">Descricao</Label>
            <Textarea
              id="plan-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao geral do plano de tratamento..."
              rows={3}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Etapas</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {steps.map((step, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Etapa {index + 1}
                  </span>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <Input
                  value={step.title}
                  onChange={(e) => updateStep(index, "title", e.target.value)}
                  placeholder="Titulo da etapa"
                />

                <Input
                  value={step.description}
                  onChange={(e) => updateStep(index, "description", e.target.value)}
                  placeholder="Descricao (opcional)"
                />

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Data alvo</Label>
                  <Input
                    type="date"
                    value={step.target_date}
                    onChange={(e) => updateStep(index, "target_date", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
