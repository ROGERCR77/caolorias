import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ReminderDialog } from "./ReminderDialog";
import type { Tables } from "@/integrations/supabase/types";

type Reminder = Tables<"reminders">;

const DAYS_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TYPE_LABELS: Record<string, string> = {
  meal: "Refeição",
  weight: "Peso",
  treat: "Petisco",
};

export const ReminderSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const fetchReminders = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("time", { ascending: true });

    if (error) {
      console.error("Error fetching reminders:", error);
    } else {
      setReminders(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const handleToggle = async (reminder: Reminder) => {
    const { error } = await supabase
      .from("reminders")
      .update({ enabled: !reminder.enabled })
      .eq("id", reminder.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lembrete.",
        variant: "destructive",
      });
    } else {
      setReminders(prev =>
        prev.map(r => r.id === reminder.id ? { ...r, enabled: !r.enabled } : r)
      );
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lembrete.",
        variant: "destructive",
      });
    } else {
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Lembrete excluído",
      });
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReminder(null);
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return "Todos os dias";
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Dias úteis";
    if (days.length === 2 && days.includes(0) && days.includes(6)) return "Fins de semana";
    return days.map(d => DAYS_LABELS[d]).join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Lembretes
        </CardTitle>
        <CardDescription>
          Configure notificações para não esquecer de registrar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum lembrete configurado
          </p>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleEdit(reminder)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{reminder.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {TYPE_LABELS[reminder.type] || reminder.type}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reminder.time.slice(0, 5)} • {formatDays(reminder.days_of_week)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={() => handleToggle(reminder)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Lembrete
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          💡 As notificações funcionam no app nativo (Android/iOS)
        </p>

        <ReminderDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          onSuccess={fetchReminders}
          reminder={editingReminder}
        />
      </CardContent>
    </Card>
  );
};
