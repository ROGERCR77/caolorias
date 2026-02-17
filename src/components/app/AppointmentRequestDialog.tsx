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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AppointmentRequestDialogProps {
  linkId: string;
  dogName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function AppointmentRequestDialog({
  linkId,
  dogName,
  open,
  onOpenChange,
  onSaved,
}: AppointmentRequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    if (!requestedDate) {
      toast({
        title: "Data obrigatória",
        description: "Selecione uma data para a consulta.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("vet_appointments")
        .insert({
          vet_dog_link_id: linkId,
          requested_by: user.id,
          status: "requested",
          requested_date: requestedDate,
          requested_time: requestedTime || null,
          reason: reason.trim() || null,
        });

      if (error) throw error;

      // Get vet_user_id from the link for push notification
      const { data: linkData } = await supabase
        .from("vet_dog_links")
        .select("vet_user_id")
        .eq("id", linkId)
        .single();

      if (linkData?.vet_user_id) {
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: linkData.vet_user_id,
              title: "Solicitação de consulta",
              message: `Solicitação de consulta${dogName ? ` para ${dogName}` : ""}`,
              data: {
                type: "appointment_request",
                link_id: linkId,
              },
            },
          });
        } catch (pushError) {
          console.log("Push notification failed (non-blocking):", pushError);
        }
      }

      toast({ title: "Solicitação enviada!" });
      setRequestedDate("");
      setRequestedTime("");
      setReason("");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error requesting appointment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar consulta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Solicitar consulta{dogName ? <> para <span className="font-medium">{dogName}</span></> : ""}.
          </p>

          <div className="space-y-2">
            <Label htmlFor="requested-date">Data desejada</Label>
            <Input
              id="requested-date"
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requested-time">Horário preferido (opcional)</Label>
            <Input
              id="requested-time"
              type="time"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da consulta..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !requestedDate}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar solicitação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
