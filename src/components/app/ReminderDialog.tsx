import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Reminder = Tables<"reminders">;

interface ReminderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reminder?: Reminder | null;
}

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export const ReminderDialog = ({
  open,
  onClose,
  onSuccess,
  reminder,
}: ReminderDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { dogs } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("meal");
  const [time, setTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [dogId, setDogId] = useState<string | null>(null);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setType(reminder.type);
      setTime(reminder.time.slice(0, 5));
      setSelectedDays(reminder.days_of_week);
      setDogId(reminder.dog_id);
    } else {
      setTitle("");
      setType("meal");
      setTime("08:00");
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setDogId(null);
    }
  }, [reminder, open]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || selectedDays.length === 0) {
      toast({
        title: "Preencha os campos",
        description: "Título e pelo menos um dia são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const data = {
      user_id: user.id,
      title: title.trim(),
      type,
      time,
      days_of_week: selectedDays,
      dog_id: dogId,
      enabled: true,
    };

    let error;

    if (reminder) {
      ({ error } = await supabase
        .from("reminders")
        .update(data)
        .eq("id", reminder.id));
    } else {
      ({ error } = await supabase.from("reminders").insert(data));
    }

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o lembrete.",
        variant: "destructive",
      });
    } else {
      toast({
        title: reminder ? "Lembrete atualizado!" : "Lembrete criado!",
      });
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {reminder ? "Editar Lembrete" : "Novo Lembrete"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Hora da refeição"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meal">Refeição</SelectItem>
                <SelectItem value="weight">Peso</SelectItem>
                <SelectItem value="treat">Petisco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Dias da semana</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          {dogs.length > 0 && (
            <div className="space-y-2">
              <Label>Cão (opcional)</Label>
              <Select 
                value={dogId || "all"} 
                onValueChange={(v) => setDogId(v === "all" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cães" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cães</SelectItem>
                  {dogs.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
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
};
