import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Clock, Dog, User, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentData {
  id: string;
  requested_date: string;
  requested_time?: string;
  reason?: string;
  dogName: string;
  tutorName: string;
}

interface AppointmentResponseDialogProps {
  appointment: AppointmentData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function AppointmentResponseDialog({
  appointment,
  open,
  onOpenChange,
  onSaved,
}: AppointmentResponseDialogProps) {
  const { toast } = useToast();
  const [vetResponseNote, setVetResponseNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponse = async (newStatus: "confirmed" | "canceled") => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("vet_appointments")
        .update({
          status: newStatus,
          vet_response_note: vetResponseNote.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.id);

      if (error) throw error;

      // Get tutor user_id from the appointment's link for push notification
      const { data: appointmentData } = await supabase
        .from("vet_appointments")
        .select("vet_dog_link_id")
        .eq("id", appointment.id)
        .single();

      if (appointmentData?.vet_dog_link_id) {
        const { data: linkData } = await supabase
          .from("vet_dog_links")
          .select("tutor_user_id")
          .eq("id", appointmentData.vet_dog_link_id)
          .single();

        if (linkData?.tutor_user_id) {
          const title = newStatus === "confirmed"
            ? "Consulta confirmada"
            : "Consulta cancelada";
          const message = newStatus === "confirmed"
            ? `Sua consulta para ${appointment.dogName} foi confirmada para ${format(parseISO(appointment.requested_date), "dd/MM/yyyy", { locale: ptBR })}.`
            : `Sua consulta para ${appointment.dogName} foi cancelada pelo veterinário.`;

          try {
            await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: linkData.tutor_user_id,
                title,
                message,
                data: {
                  type: "appointment_response",
                  appointment_id: appointment.id,
                  status: newStatus,
                },
              },
            });
          } catch (pushError) {
            console.log("Push notification failed (non-blocking):", pushError);
          }
        }
      }

      toast({
        title: newStatus === "confirmed"
          ? "Consulta confirmada!"
          : "Consulta cancelada",
      });
      setVetResponseNote("");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error responding to appointment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a consulta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Responder solicitação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment details */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Dog className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{appointment.dogName}</p>
                <p className="text-xs text-muted-foreground">Paciente</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{appointment.tutorName}</p>
                <p className="text-xs text-muted-foreground">Tutor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {format(parseISO(appointment.requested_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">Data solicitada</p>
              </div>
            </div>

            {appointment.requested_time && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Clock className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{appointment.requested_time}</p>
                  <p className="text-xs text-muted-foreground">Horário preferido</p>
                </div>
              </div>
            )}

            {appointment.reason && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{appointment.reason}</p>
                  <p className="text-xs text-muted-foreground">Motivo</p>
                </div>
              </div>
            )}
          </div>

          {/* Vet response note */}
          <div className="space-y-2">
            <Label htmlFor="vet-note">Observação (opcional)</Label>
            <Textarea
              id="vet-note"
              value={vetResponseNote}
              onChange={(e) => setVetResponseNote(e.target.value)}
              placeholder="Adicione uma observação para o tutor..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => handleResponse("canceled")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Cancelar consulta"
            )}
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleResponse("confirmed")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
