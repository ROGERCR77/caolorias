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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface PrescriptionItem {
  food_name: string;
  grams: number;
  meal_number: number;
}

interface PrescriptionFormProps {
  linkId: string;
  vetUserId: string;
  dogName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function PrescriptionForm({
  linkId,
  vetUserId,
  dogName,
  open,
  onOpenChange,
  onSaved,
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [totalKcalTarget, setTotalKcalTarget] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("2");
  const [items, setItems] = useState<PrescriptionItem[]>([
    { food_name: "", grams: 0, meal_number: 1 },
  ]);

  const addItem = () => {
    setItems((prev) => [...prev, { food_name: "", grams: 0, meal_number: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setTotalKcalTarget("");
    setMealsPerDay("2");
    setItems([{ food_name: "", grams: 0, meal_number: 1 }]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Preencha os campos",
        description: "O titulo da prescricao e obrigatorio.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter((item) => item.food_name.trim() && item.grams > 0);
    if (validItems.length === 0) {
      toast({
        title: "Adicione alimentos",
        description: "Adicione pelo menos um alimento com gramas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Insert prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from("vet_prescriptions")
        .insert({
          vet_dog_link_id: linkId,
          vet_user_id: vetUserId,
          title: title.trim(),
          notes: notes.trim() || null,
          total_kcal_target: totalKcalTarget ? parseInt(totalKcalTarget) : null,
          meals_per_day: parseInt(mealsPerDay),
          is_active: true,
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // 2. Insert prescription items
      const itemsToInsert = validItems.map((item) => ({
        prescription_id: prescription.id,
        food_name: item.food_name.trim(),
        grams: item.grams,
        meal_number: item.meal_number,
      }));

      const { error: itemsError } = await supabase
        .from("vet_prescription_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

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
              title: "Nova prescricao alimentar",
              message: `Dr(a). ${vetProfile?.name || "Veterinario"} prescreveu uma dieta para ${dogName}`,
              data: {
                type: "vet_prescription",
                prescription_id: prescription.id,
              },
            },
          });
        }
      } catch (pushError) {
        console.log("Push notification failed (non-blocking):", pushError);
      }

      toast({ title: "Prescricao salva!" });
      resetForm();
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel salvar a prescricao.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mealOptions = Array.from({ length: parseInt(mealsPerDay) }, (_, i) => i + 1);

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
          <DialogTitle>Nova Prescricao Alimentar</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
          <div className="space-y-2">
            <Label htmlFor="prescription-title">Titulo</Label>
            <Input
              id="prescription-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dieta hipoalergenica"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription-notes">Observacoes</Label>
            <Textarea
              id="prescription-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucoes adicionais para o tutor..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="total-kcal">Meta kcal/dia</Label>
              <Input
                id="total-kcal"
                type="number"
                value={totalKcalTarget}
                onChange={(e) => setTotalKcalTarget(e.target.value)}
                placeholder="Ex: 800"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Refeicoes/dia</Label>
              <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 refeicoes</SelectItem>
                  <SelectItem value="3">3 refeicoes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Alimentos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <Input
                  value={item.food_name}
                  onChange={(e) => updateItem(index, "food_name", e.target.value)}
                  placeholder="Nome do alimento"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={item.grams || ""}
                    onChange={(e) => updateItem(index, "grams", parseInt(e.target.value) || 0)}
                    placeholder="Gramas"
                    min={0}
                  />
                  <Select
                    value={String(item.meal_number)}
                    onValueChange={(v) => updateItem(index, "meal_number", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Refeicao" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealOptions.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          Refeicao {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
