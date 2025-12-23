import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Stethoscope, X, Search, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VetProfile {
  id: string;
  user_id: string;
  name: string;
  crmv: string;
  uf: string;
  clinic_name: string | null;
  vet_code: string;
}

interface VetLink {
  id: string;
  vet_user_id: string;
  status: string;
  vet_profile: VetProfile;
}

interface VetLinkCardProps {
  dogId: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-600", icon: <Clock className="w-3 h-3" /> },
  active: { label: "Ativo", color: "bg-green-500/10 text-green-600", icon: <CheckCircle className="w-3 h-3" /> },
  revoked: { label: "Revogado", color: "bg-red-500/10 text-red-600", icon: <XCircle className="w-3 h-3" /> },
};

export function VetLinkCard({ dogId }: VetLinkCardProps) {
  const { user } = useAuth();
  const [vetLinks, setVetLinks] = useState<VetLink[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Search
  const [vetCode, setVetCode] = useState("");
  const [searchResult, setSearchResult] = useState<VetProfile | null>(null);
  const [searchError, setSearchError] = useState("");

  // Fetch existing links
  useEffect(() => {
    if (!user || !dogId) return;
    
    const fetchLinks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("vet_dog_links")
          .select(`
            id,
            vet_user_id,
            status,
            vet_profile:vet_profiles!vet_dog_links_vet_profile_fkey(
              id, user_id, name, crmv, uf, clinic_name, vet_code
            )
          `)
          .eq("dog_id", dogId)
          .eq("tutor_user_id", user.id)
          .neq("status", "revoked");

        if (error) throw error;

        // Handle the joined data
        const typedLinks = (data || []).map(link => ({
          ...link,
          vet_profile: Array.isArray(link.vet_profile) ? link.vet_profile[0] : link.vet_profile,
        })).filter(link => link.vet_profile) as VetLink[];

        setVetLinks(typedLinks);
      } catch (error) {
        console.error("Error fetching vet links:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [user, dogId]);

  const searchVet = async () => {
    if (!vetCode.trim()) {
      setSearchError("Digite o código do veterinário");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from("vet_profiles")
        .select("*")
        .eq("vet_code", vetCode.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSearchError("Veterinário não encontrado. Verifique o código.");
        return;
      }

      // Check if already linked
      const existingLink = vetLinks.find(l => l.vet_user_id === data.user_id);
      if (existingLink) {
        setSearchError("Este veterinário já está vinculado a este cão.");
        return;
      }

      setSearchResult(data);
    } catch (error) {
      console.error("Error searching vet:", error);
      setSearchError("Erro ao buscar veterinário");
    } finally {
      setIsSearching(false);
    }
  };

  const linkVet = async () => {
    if (!user || !dogId || !searchResult) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("vet_dog_links")
        .insert({
          dog_id: dogId,
          vet_user_id: searchResult.user_id,
          tutor_user_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setVetLinks(prev => [...prev, {
        id: data.id,
        vet_user_id: searchResult.user_id,
        status: "pending",
        vet_profile: searchResult,
      }]);

      toast.success("Solicitação enviada!", {
        description: `Aguarde ${searchResult.name} aceitar o vínculo.`,
      });

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error linking vet:", error);
      toast.error("Erro ao vincular veterinário");
    } finally {
      setIsSaving(false);
    }
  };

  const unlinkVet = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("vet_dog_links")
        .update({ status: "revoked" })
        .eq("id", linkId);

      if (error) throw error;

      setVetLinks(prev => prev.filter(l => l.id !== linkId));
      toast.success("Vínculo removido");
    } catch (error) {
      console.error("Error unlinking vet:", error);
      toast.error("Erro ao remover vínculo");
    }
  };

  const resetForm = () => {
    setVetCode("");
    setSearchResult(null);
    setSearchError("");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-blue-500" />
            Meu Veterinário
          </span>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Vincular Veterinário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Digite o código do veterinário para vinculá-lo ao seu cão.
                    O veterinário fornecerá este código.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: ABC12345"
                      value={vetCode}
                      onChange={(e) => setVetCode(e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                      maxLength={8}
                    />
                    <Button
                      variant="outline"
                      onClick={searchVet}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {searchError && (
                    <p className="text-sm text-destructive mt-2">{searchError}</p>
                  )}
                </div>

                {/* Search Result */}
                {searchResult && (
                  <Card className="p-4 border-blue-500/30 bg-blue-500/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Stethoscope className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{searchResult.name}</p>
                        <p className="text-sm text-muted-foreground">
                          CRMV {searchResult.crmv}/{searchResult.uf}
                        </p>
                        {searchResult.clinic_name && (
                          <p className="text-sm text-muted-foreground">
                            {searchResult.clinic_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={linkVet}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Enviar solicitação
                    </Button>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : vetLinks.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum veterinário vinculado. Adicione usando o código do profissional.
          </p>
        ) : (
          <div className="space-y-2">
            {vetLinks.map(link => {
              const statusInfo = STATUS_LABELS[link.status] || STATUS_LABELS.pending;
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Stethoscope className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {link.vet_profile.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        CRMV {link.vet_profile.crmv}/{link.vet_profile.uf}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`gap-1 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => unlinkVet(link.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
