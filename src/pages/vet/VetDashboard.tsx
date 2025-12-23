import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, Dog, Bell, Settings, LogOut, 
  ChevronRight, Clock, CheckCircle, XCircle, Loader2, Copy, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VetProfile {
  id: string;
  name: string;
  crmv: string;
  uf: string;
  clinic_name: string | null;
  vet_code: string;
}

interface LinkedDog {
  id: string;
  dog_id: string;
  status: string;
  created_at: string;
  dog: {
    id: string;
    name: string;
    breed: string | null;
    photo_url: string | null;
  };
  tutor: {
    name: string;
  };
}

const VetDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(null);
  const [linkedDogs, setLinkedDogs] = useState<LinkedDog[]>([]);
  const [pendingLinks, setPendingLinks] = useState<LinkedDog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch vet profile
        const { data: profile, error: profileError } = await supabase
          .from("vet_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) throw profileError;
        setVetProfile(profile);

        // Fetch linked dogs
        const { data: links, error: linksError } = await supabase
          .from("vet_dog_links")
          .select(`
            id,
            dog_id,
            status,
            created_at,
            dog:dogs(id, name, breed, photo_url),
            tutor:profiles!vet_dog_links_tutor_profile_fkey(name)
          `)
          .eq("vet_user_id", user.id)
          .order("created_at", { ascending: false });

        if (linksError) throw linksError;

        // Type assertion to handle the joined data
        const typedLinks = (links || []).map(link => ({
          ...link,
          dog: Array.isArray(link.dog) ? link.dog[0] : link.dog,
          tutor: Array.isArray(link.tutor) ? link.tutor[0] : link.tutor,
        })) as LinkedDog[];

        setLinkedDogs(typedLinks.filter(l => l.status === "active"));
        setPendingLinks(typedLinks.filter(l => l.status === "pending"));
      } catch (error) {
        console.error("Error fetching vet data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Tente recarregar a página.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleAcceptLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("vet_dog_links")
        .update({ status: "active" })
        .eq("id", linkId);

      if (error) throw error;

      // Move from pending to active
      const accepted = pendingLinks.find(l => l.id === linkId);
      if (accepted) {
        setPendingLinks(prev => prev.filter(l => l.id !== linkId));
        setLinkedDogs(prev => [{ ...accepted, status: "active" }, ...prev]);
      }

      toast({
        title: "Vínculo aceito! 🎉",
        description: "Agora você pode acessar o prontuário deste paciente.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar o vínculo.",
        variant: "destructive",
      });
    }
  };

  const handleRejectLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("vet_dog_links")
        .update({ status: "revoked" })
        .eq("id", linkId);

      if (error) throw error;

      setPendingLinks(prev => prev.filter(l => l.id !== linkId));

      toast({
        title: "Vínculo recusado",
        description: "O tutor será notificado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível recusar o vínculo.",
        variant: "destructive",
      });
    }
  };

  const copyVetCode = () => {
    if (vetProfile?.vet_code) {
      navigator.clipboard.writeText(vetProfile.vet_code);
      setCodeCopied(true);
      toast({
        title: "Código copiado!",
        description: "Compartilhe com seus clientes para vinculação.",
      });
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-teal-500 text-white safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Cãolorias Vet</h1>
                <p className="text-sm text-white/80">
                  {vetProfile?.name} • CRMV {vetProfile?.crmv}/{vetProfile?.uf}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 pb-24">
        {/* Vet Code Card */}
        <Card className="p-4 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Seu código de vinculação</p>
              <p className="text-2xl font-mono font-bold text-blue-600">
                {vetProfile?.vet_code}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={copyVetCode}
            >
              {codeCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Compartilhe este código com os tutores para que eles vinculem os cães a você.
          </p>
        </Card>

        {/* Pending Links */}
        {pendingLinks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold">Solicitações pendentes</h2>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                {pendingLinks.length}
              </Badge>
            </div>

            {pendingLinks.map((link) => (
              <Card key={link.id} className="p-4 border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {link.dog?.photo_url ? (
                      <img src={link.dog.photo_url} alt={link.dog?.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dog className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{link.dog?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      Tutor: {link.tutor?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {format(new Date(link.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleRejectLink(link.id)}
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleAcceptLink(link.id)}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Active Dogs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Dog className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold">Meus pacientes</h2>
            <Badge variant="secondary">
              {linkedDogs.length}
            </Badge>
          </div>

          {linkedDogs.length === 0 ? (
            <Card className="p-8 text-center">
              <Dog className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Nenhum paciente vinculado ainda.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Compartilhe seu código com os tutores.
              </p>
            </Card>
          ) : (
            linkedDogs.map((link) => (
              <Link key={link.id} to={`/vet/dog/${link.dog_id}`}>
                <Card className="p-4 press-effect hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      {link.dog?.photo_url ? (
                        <img src={link.dog.photo_url} alt={link.dog?.name} className="w-full h-full object-cover" />
                      ) : (
                        <Dog className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{link.dog?.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {link.dog?.breed || "Sem raça definida"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tutor: {link.tutor?.name}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default VetDashboard;
