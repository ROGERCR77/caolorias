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
import { Loader2 } from "lucide-react";
import { addDays, format } from "date-fns";

interface MedicationFormProps {
  linkId: string;
  vetUserId: string;
  dogName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: "1x ao dia", label: "1x ao dia" },
  { value: "2x ao dia", label: "2x ao dia" },
  { value: "a cada 8h", label: "A cada 8h" },
  { value: "a cada 12h", label: "A cada 12h" },
];

const FREQUENCY_TIMES: Record<string, string[]> = {
  "1x ao dia": ["08:00"],
  "2x ao dia": ["08:00", "20:00"],
  "a cada 8h": ["08:00", "16:00", "00:00"],
  "a cada 12h": ["08:00", "20:00"],
};

export function MedicationForm({
  linkId,
  vetUserId,
  dogName,
  open,
  onOpenChange,
  onSaved,
}: MedicationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("1x ao dia");
  const [durationDays, setDurationDays] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setMedicationName("");
    setDosage("");
    setFrequency("1x ao dia");
    setDurationDays("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!medicationName.trim()) {
      toast({
        title: "Preencha os campos",
        description: "O nome do medicamento e obrigatorio.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate) {
      toast({
        title: "Preencha os campos",
        description: "A data de inicio e obrigatoria.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const parsedDuration = durationDays ? parseInt(durationDays) : null;
      const endDate = parsedDuration
        ? format(addDays(new Date(startDate), parsedDuration), "yyyy-MM-dd")
        : null;

      // 1. Insert medication
      const { data: medication, error: medError } = await supabase
        .from("vet_medications")
        .insert({
          vet_dog_link_id: linkId,
          vet_user_id: vetUserId,
          medication_name: medicationName.trim(),
          dosage: dosage.trim() || null,
          frequency,
          duration_days: parsedDuration,
          start_date: startDate,
          end_date: endDate,
          notes: notes.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (medError) throw medError;

      // 2. Create reminders for tutor based on frequency
      try {
        const { data: linkData } = await supabase
          .from("vet_dog_links")
          .select("tutor_user_id, dog_id")
          .eq("id", linkId)
          .single();

        if (linkData?.tutor_user_id) {
          const times = FREQUENCY_TIMES[frequency] || ["08:00"];

          const reminders = times.map((time) => ({
            user_id: linkData.tutor_user_id,
            title: `${medicationName.trim()} - ${dosage.trim() || "Medicamento"}`,
            type: "medication",
            time,
            days_of_week: [0, 1, 2, 3, 4, 5, 6],
            dog_id: linkData.dog_id,
            enabled: true,
          }));

          const { error: remindersError } = await supabase
            .from("reminders")
            .insert(reminders);

          if (remindersError) {
            console.log("Reminders creation failed (non-blocking):", remindersError);
          }

          // 3. Send push notification to tutor
          const { data: vetProfile } = await supabase
            .from("vet_profiles")
            .select("name")
            .eq("user_id", vetUserId)
            .single();

          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: linkData.tutor_user_id,
              title: "Novo medicamento prescrito",
              message: `Dr(a). ${vetProfile?.name || "Veterinario"} prescreveu ${medicationName.trim()} para ${dogName}`,
              data: {
                type: "vet_medication",
                medication_id: medication.id,
              },
            },
          });
        }
      } catch (pushError) {
        console.log("Push notification failed (non-blocking):", pushError);
      }

      toast({ title: "Medicamento salvo!" });
      resetForm();
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error saving medication:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel salvar o medicamento.",
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
      <DialogContent className="sm:max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Novo Medicamento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
          <div className="space-y-2">
            <Label htmlFor="med-name">Nome do medicamento</Label>
            <Input
              id="med-name"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="Ex: Doxiciclina"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="med-dosage">Dosagem</Label>
            <Input
              id="med-dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Ex: 100mg, 1 comprimido"
            />
          </div>

          <div className="space-y-2">
            <Label>Frequencia</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="med-duration">Duracao (dias)</Label>
              <Input
                id="med-duration"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="Ex: 7"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-start">Data de inicio</Label>
              <Input
                id="med-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="med-notes">Observacoes</Label>
            <Textarea
              id="med-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucoes adicionais..."
              rows={3}
            />
          </div>

          {durationDays && startDate && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Termino previsto:{" "}
                <span className="font-medium">
                  {format(addDays(new Date(startDate), parseInt(durationDays)), "dd/MM/yyyy")}
                </span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                Lembretes serao criados: {(FREQUENCY_TIMES[frequency] || ["08:00"]).join(", ")}
              </p>
            </div>
          )}
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
