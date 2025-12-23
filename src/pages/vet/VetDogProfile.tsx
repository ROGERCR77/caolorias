import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Dog, Plus, Syringe, FileText, 
  Microscope, MessageSquare, Calendar, Loader2, Stethoscope,
  ChartBar, Scale, Utensils, Activity, Heart
} from "lucide-react";
import { HealthHistoryTab } from "@/components/vet/HealthHistoryTab";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type NoteType = "consulta" | "vacina" | "exame" | "observacao";

interface DogInfo {
  id: string;
  name: string;
  breed: string | null;
  birth_date: string | null;
  current_weight_kg: number | null;
  photo_url: string | null;
  sex: string | null;
}

interface VetNote {
  id: string;
  note_type: NoteType;
  title: string;
  content: string | null;
  scheduled_date: string | null;
  created_at: string;
}

interface TutorReport {
  id: string;
  generated_at: string;
  report_data: {
    dogInfo: {
      name: string;
      breed: string | null;
      current_weight_kg: number | null;
      meta_kcal_dia: number | null;
      objetivo: string | null;
    };
    weightHistory: { date: string; weight_kg: number }[];
    mealsSummary: { count: number; avgKcal: number };
    healthData: {
      symptoms: any[];
      poopLogs: any[];
      energyLogs: any[];
      activityLogs: any[];
      intolerances: any[];
    };
  };
}

interface VetDogLink {
  id: string;
  tutor: {
    name: string;
  };
}

const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: any; color: string }> = {
  consulta: { label: "Consulta", icon: Stethoscope, color: "text-blue-500" },
  vacina: { label: "Vacina", icon: Syringe, color: "text-green-500" },
  exame: { label: "Exame", icon: Microscope, color: "text-purple-500" },
  observacao: { label: "Observação", icon: MessageSquare, color: "text-amber-500" },
};

const VetDogProfile = () => {
  const { dogId } = useParams<{ dogId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [dog, setDog] = useState<DogInfo | null>(null);
  const [link, setLink] = useState<VetDogLink | null>(null);
  const [notes, setNotes] = useState<VetNote[]>([]);
  const [tutorReports, setTutorReports] = useState<TutorReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  // New note form
  const [newNoteType, setNewNoteType] = useState<NoteType>("consulta");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteScheduledDate, setNewNoteScheduledDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !dogId) return;

      try {
        // Fetch dog info
        const { data: dogData, error: dogError } = await supabase
          .from("dogs")
          .select("id, name, breed, birth_date, current_weight_kg, photo_url, sex")
          .eq("id", dogId)
          .single();

        if (dogError) throw dogError;
        setDog(dogData);

        // Fetch link info
        const { data: linkData, error: linkError } = await supabase
          .from("vet_dog_links")
          .select(`
            id,
            tutor:profiles!vet_dog_links_tutor_profile_fkey(name)
          `)
          .eq("vet_user_id", user.id)
          .eq("dog_id", dogId)
          .eq("status", "active")
          .single();

        if (linkError) throw linkError;
        
        const typedLink = {
          ...linkData,
          tutor: Array.isArray(linkData.tutor) ? linkData.tutor[0] : linkData.tutor,
        } as VetDogLink;
        setLink(typedLink);

        // Fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from("vet_notes")
          .select("*")
          .eq("vet_dog_link_id", typedLink.id)
          .order("created_at", { ascending: false });

        if (notesError) throw notesError;
        setNotes((notesData || []) as VetNote[]);

        // Fetch tutor reports
        const { data: reportsData } = await supabase
          .from("tutor_health_reports")
          .select("id, generated_at, report_data, viewed_by_vet")
          .eq("dog_id", dogId)
          .order("generated_at", { ascending: false })
          .limit(10);

        if (reportsData) {
          setTutorReports(reportsData as unknown as TutorReport[]);
          
          // Mark unread reports as viewed
          const unreadIds = reportsData.filter(r => !r.viewed_by_vet).map(r => r.id);
          if (unreadIds.length > 0) {
            await supabase
              .from("tutor_health_reports")
              .update({ viewed_by_vet: true })
              .in("id", unreadIds);
          }
        }
      } catch (error) {
        console.error("Error fetching dog data:", error);
        toast({
          title: "Erro ao carregar dados",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, dogId, toast]);

  const handleAddNote = async () => {
    if (!user || !link || !newNoteTitle.trim()) {
      toast({
        title: "Preencha o título",
        variant: "destructive",
      });
      return;
    }

    setIsAddingNote(true);

    try {
      const { data, error } = await supabase
        .from("vet_notes")
        .insert({
          vet_dog_link_id: link.id,
          vet_user_id: user.id,
          note_type: newNoteType,
          title: newNoteTitle.trim(),
          content: newNoteContent.trim() || null,
          scheduled_date: newNoteScheduledDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Get tutor_user_id from the link to send push notification
      const { data: linkData } = await supabase
        .from("vet_dog_links")
        .select("tutor_user_id")
        .eq("id", link.id)
        .single();

      // Get vet profile for the notification message
      const { data: vetProfile } = await supabase
        .from("vet_profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      // Send push notification to tutor
      if (linkData) {
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_id: linkData.tutor_user_id,
              title: "Nova observação do veterinário",
              message: `Dr(a). ${vetProfile?.name || "Veterinário"} adicionou uma observação sobre ${dog?.name}.`,
              data: {
                type: "vet_note",
                dog_id: dogId,
                note_type: newNoteType,
              },
            },
          });
          console.log("Push notification sent to tutor:", linkData.tutor_user_id);
        } catch (pushError) {
          console.log("Push notification failed (non-blocking):", pushError);
        }
      }

      setNotes(prev => [data as VetNote, ...prev]);
      setDialogOpen(false);
      resetForm();

      toast({
        title: "Registro adicionado! ✅",
        description: "O tutor poderá visualizar no app.",
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Erro ao adicionar registro",
        variant: "destructive",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  const resetForm = () => {
    setNewNoteType("consulta");
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteScheduledDate("");
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "Idade desconhecida";
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} meses`;
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  };

  const filterNotesByType = (type: NoteType) => notes.filter(n => n.note_type === type);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!dog || !link) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Dog className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Paciente não encontrado.</p>
        <Link to="/vet/dashboard">
          <Button variant="link" className="mt-2">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-teal-500 text-white safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/vet/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {dog.photo_url ? (
                  <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                ) : (
                  <Dog className="w-6 h-6" />
                )}
              </div>
              <div>
                <h1 className="font-bold text-lg">{dog.name}</h1>
                <p className="text-sm text-white/80">Tutor: {link.tutor?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 pb-24">
        {/* Dog Info Card */}
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Raça</p>
              <p className="font-medium">{dog.breed || "SRD"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Idade</p>
              <p className="font-medium">{calculateAge(dog.birth_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Peso atual</p>
              <p className="font-medium">{dog.current_weight_kg ? `${dog.current_weight_kg} kg` : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sexo</p>
              <p className="font-medium">{dog.sex === "macho" ? "Macho" : dog.sex === "femea" ? "Fêmea" : "—"}</p>
            </div>
          </div>
        </Card>

        {/* Add Note Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 bg-gradient-to-r from-blue-500 to-teal-500">
              <Plus className="w-5 h-5" />
              Adicionar registro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo registro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newNoteType} onValueChange={(v) => setNewNoteType(v as NoteType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={`w-4 h-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  placeholder={newNoteType === "vacina" ? "Ex: V10" : "Ex: Consulta de rotina"}
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Observações, diagnóstico, prescrições..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={4}
                />
              </div>

              {(newNoteType === "vacina" || newNoteType === "consulta") && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data do próximo {newNoteType === "vacina" ? "reforço" : "retorno"}
                  </Label>
                  <Input
                    type="date"
                    value={newNoteScheduledDate}
                    onChange={(e) => setNewNoteScheduledDate(e.target.value)}
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleAddNote}
                disabled={isAddingNote || !newNoteTitle.trim()}
              >
                {isAddingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar registro"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notes Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-7">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="historico" className="text-green-600">
              <Heart className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="relatorios">
              <ChartBar className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="consulta">
              <Stethoscope className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="vacina">
              <Syringe className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="exame">
              <Microscope className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="observacao">
              <MessageSquare className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            {notes.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhum registro ainda.</p>
              </Card>
            ) : (
              notes.map((note) => <NoteCard key={note.id} note={note} />)
            )}
          </TabsContent>

          {/* Aba de Histórico de Saúde */}
          <TabsContent value="historico" className="mt-4">
            <HealthHistoryTab dogId={dogId!} />
          </TabsContent>

          {/* Aba de Relatórios do Tutor */}
          <TabsContent value="relatorios" className="mt-4 space-y-3">
            {tutorReports.length === 0 ? (
              <Card className="p-8 text-center">
                <ChartBar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">O tutor ainda não gerou relatórios.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os relatórios aparecem quando o tutor gera no app.
                </p>
              </Card>
            ) : (
              tutorReports.map((report) => (
                <Card 
                  key={report.id} 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <ChartBar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Relatório de Saúde</p>
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(report.generated_at), "dd/MM/yy", { locale: ptBR })}
                        </Badge>
                      </div>
                      
                      {/* Summary */}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Scale className="w-3 h-3" />
                          {report.report_data?.dogInfo?.current_weight_kg || "-"} kg
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Utensils className="w-3 h-3" />
                          ~{report.report_data?.mealsSummary?.avgKcal || 0} kcal/dia
                        </span>
                        {report.report_data?.healthData?.activityLogs?.length > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Activity className="w-3 h-3" />
                            {report.report_data.healthData.activityLogs.length} atividades
                          </span>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {expandedReport === report.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {/* Weight History */}
                          {report.report_data?.weightHistory?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Histórico de Peso</p>
                              <div className="space-y-1">
                                {report.report_data.weightHistory.slice(0, 5).map((w, i) => (
                                  <p key={i} className="text-xs text-muted-foreground">
                                    {format(new Date(w.date), "dd/MM")} - {w.weight_kg} kg
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Health Summary */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-muted">
                              <p className="font-medium">Fezes</p>
                              <p className="text-muted-foreground">
                                {report.report_data?.healthData?.poopLogs?.length || 0} registros
                              </p>
                            </div>
                            <div className="p-2 rounded bg-muted">
                              <p className="font-medium">Energia</p>
                              <p className="text-muted-foreground">
                                {report.report_data?.healthData?.energyLogs?.length || 0} registros
                              </p>
                            </div>
                            <div className="p-2 rounded bg-muted">
                              <p className="font-medium">Sintomas</p>
                              <p className="text-muted-foreground">
                                {report.report_data?.healthData?.symptoms?.length || 0} ocorrências
                              </p>
                            </div>
                            <div className="p-2 rounded bg-muted">
                              <p className="font-medium">Intolerâncias</p>
                              <p className="text-muted-foreground">
                                {report.report_data?.healthData?.intolerances?.length || 0} registradas
                              </p>
                            </div>
                          </div>

                          {/* Intolerances List */}
                          {report.report_data?.healthData?.intolerances?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1 text-red-600">⚠️ Alergias/Intolerâncias</p>
                              <div className="space-y-1">
                                {report.report_data.healthData.intolerances.map((i: any, idx: number) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    • {i.food_name || "Alimento"} ({i.reaction_type})
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {(["consulta", "vacina", "exame", "observacao"] as NoteType[]).map((type) => (
            <TabsContent key={type} value={type} className="mt-4 space-y-3">
              {filterNotesByType(type).length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum registro de {NOTE_TYPE_CONFIG[type].label.toLowerCase()}.
                  </p>
                </Card>
              ) : (
                filterNotesByType(type).map((note) => <NoteCard key={note.id} note={note} />)
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

const NoteCard = ({ note }: { note: VetNote }) => {
  const config = NOTE_TYPE_CONFIG[note.note_type];
  const Icon = config.icon;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
            {note.scheduled_date && (
              <Badge variant="outline" className="text-xs gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(note.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
              </Badge>
            )}
          </div>
          <p className="font-medium">{note.title}</p>
          {note.content && (
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {note.content}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default VetDogProfile;
