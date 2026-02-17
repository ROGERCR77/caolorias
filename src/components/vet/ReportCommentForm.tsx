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
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ReportCommentFormProps {
  reportId: string;
  vetUserId: string;
  dogName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const MAX_CHARS = 2000;

export function ReportCommentForm({
  reportId,
  vetUserId,
  dogName,
  open,
  onOpenChange,
  onSaved,
}: ReportCommentFormProps) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Escreva um comentário antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("vet_report_comments")
        .insert({
          report_id: reportId,
          vet_user_id: vetUserId,
          content: content.trim(),
        });

      if (error) throw error;

      // Get tutor_user_id from the report and vet name for push notification
      const [reportRes, vetProfileRes] = await Promise.all([
        supabase
          .from("tutor_health_reports")
          .select("tutor_user_id")
          .eq("id", reportId)
          .single(),
        supabase
          .from("vet_profiles")
          .select("name")
          .eq("user_id", vetUserId)
          .single(),
      ]);

      if (reportRes.data?.tutor_user_id) {
        const vetName = vetProfileRes.data?.name || "Veterinário";
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: reportRes.data.tutor_user_id,
              title: "Comentário do veterinário",
              message: `Dr(a). ${vetName} comentou no seu relatório de ${dogName}`,
              data: {
                type: "vet_report_comment",
                report_id: reportId,
              },
            },
          });
        } catch (pushError) {
          console.log("Push notification failed (non-blocking):", pushError);
        }
      }

      toast({ title: "Comentário salvo!" });
      setContent("");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error("Error saving comment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o comentário.",
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
          <DialogTitle>Comentar relatório</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Adicione um comentário ao relatório de <span className="font-medium">{dogName}</span>.
          </p>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário</Label>
            <Textarea
              id="comment"
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setContent(e.target.value);
                }
              }}
              placeholder="Escreva seu comentário sobre o relatório..."
              rows={5}
              maxLength={MAX_CHARS}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/{MAX_CHARS}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
            {isSaving ? (
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
