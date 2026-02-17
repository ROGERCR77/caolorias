import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { FeatureGateBlur } from "@/components/app/FeatureGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Stethoscope,
  Syringe,
  Microscope,
  Pill,
  ClipboardList,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";

// ---- Types ----

interface VetProfile {
  name: string;
  clinic_name: string | null;
}

interface VetNoteAttachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
}

interface VetNote {
  id: string;
  note_type: string;
  title: string;
  content: string | null;
  scheduled_date: string | null;
  created_at: string;
  vet_profile: VetProfile | null;
  vet_note_attachments: VetNoteAttachment[];
}

interface VetMedication {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  duration_days: number | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  vet_profile: VetProfile | null;
}

interface VetPrescription {
  id: string;
  title: string;
  notes: string | null;
  total_kcal_target: number | null;
  meals_per_day: number;
  is_active: boolean;
  valid_until: string | null;
  created_at: string;
  vet_profile: VetProfile | null;
}

interface VetTreatmentStep {
  id: string;
  step_number: number;
  title: string;
  description: string | null;
  target_date: string | null;
  completed_at: string | null;
}

interface VetTreatmentPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  vet_profile: VetProfile | null;
  vet_treatment_steps: VetTreatmentStep[];
}

// ---- Helpers ----

const NOTE_TYPE_ICONS: Record<string, React.ReactNode> = {
  consulta: <Stethoscope className="w-4 h-4" />,
  vacina: <Syringe className="w-4 h-4" />,
  exame: <Microscope className="w-4 h-4" />,
  observacao: <FileText className="w-4 h-4" />,
};

const NOTE_TYPE_COLORS: Record<string, string> = {
  consulta: "bg-blue-500/10 text-blue-600",
  vacina: "bg-green-500/10 text-green-600",
  exame: "bg-purple-500/10 text-purple-600",
  observacao: "bg-slate-500/10 text-slate-600",
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  consulta: "Consulta",
  vacina: "Vacina",
  exame: "Exame",
  observacao: "Observacao",
};

function resolveVetProfile(raw: any): VetProfile | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw as VetProfile;
}

// ---- Main Component ----

const Prontuario = () => {
  const { user } = useAuth();
  const { dogs, selectedDogId, isLoading: dataLoading } = useData();
  const { canAccessFeature } = useSubscription();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todos");

  // Data states
  const [vetNotes, setVetNotes] = useState<VetNote[]>([]);
  const [medications, setMedications] = useState<VetMedication[]>([]);
  const [prescriptions, setPrescriptions] = useState<VetPrescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<VetTreatmentPlan[]>([]);

  // Attachment preview
  const [previewAttachment, setPreviewAttachment] = useState<VetNoteAttachment | null>(null);

  const selectedDog = useMemo(
    () => dogs.find((d) => d.id === selectedDogId),
    [dogs, selectedDogId]
  );

  // Fetch all prontuario data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedDogId) {
        setVetNotes([]);
        setMedications([]);
        setPrescriptions([]);
        setTreatmentPlans([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Get active vet links for this dog
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select("id")
          .eq("dog_id", selectedDogId)
          .eq("tutor_user_id", user.id)
          .eq("status", "active");

        if (!links || links.length === 0) {
          setVetNotes([]);
          setMedications([]);
          setPrescriptions([]);
          setTreatmentPlans([]);
          setIsLoading(false);
          return;
        }

        const linkIds = links.map((l) => l.id);

        // Fetch all data in parallel
        const [notesRes, medsRes, prescRes, plansRes] = await Promise.all([
          supabase
            .from("vet_notes")
            .select(`
              id, note_type, title, content, scheduled_date, created_at,
              vet_profile:vet_profiles!vet_notes_vet_profile_fkey(name, clinic_name),
              vet_note_attachments(id, file_url, file_name, file_type)
            `)
            .in("vet_dog_link_id", linkIds)
            .order("created_at", { ascending: false }),

          supabase
            .from("vet_medications")
            .select(`
              id, medication_name, dosage, frequency, duration_days,
              start_date, end_date, notes, is_active, created_at,
              vet_profile:vet_profiles!vet_medications_vet_user_id_fkey(name, clinic_name)
            `)
            .in("vet_dog_link_id", linkIds)
            .order("created_at", { ascending: false }),

          supabase
            .from("vet_prescriptions")
            .select(`
              id, title, notes, total_kcal_target, meals_per_day,
              is_active, valid_until, created_at,
              vet_profile:vet_profiles!vet_prescriptions_vet_user_id_fkey(name, clinic_name)
            `)
            .in("vet_dog_link_id", linkIds)
            .order("created_at", { ascending: false }),

          supabase
            .from("vet_treatment_plans")
            .select(`
              id, title, description, status, created_at,
              vet_profile:vet_profiles!vet_treatment_plans_vet_user_id_fkey(name, clinic_name),
              vet_treatment_steps(id, step_number, title, description, target_date, completed_at)
            `)
            .in("vet_dog_link_id", linkIds)
            .order("created_at", { ascending: false }),
        ]);

        // Map notes with resolved vet_profile
        if (notesRes.data) {
          setVetNotes(
            notesRes.data.map((n: any) => ({
              ...n,
              vet_profile: resolveVetProfile(n.vet_profile),
              vet_note_attachments: n.vet_note_attachments || [],
            }))
          );
        }

        if (medsRes.data) {
          setMedications(
            medsRes.data.map((m: any) => ({
              ...m,
              vet_profile: resolveVetProfile(m.vet_profile),
            }))
          );
        }

        if (prescRes.data) {
          setPrescriptions(
            prescRes.data.map((p: any) => ({
              ...p,
              vet_profile: resolveVetProfile(p.vet_profile),
            }))
          );
        }

        if (plansRes.data) {
          setTreatmentPlans(
            plansRes.data.map((pl: any) => ({
              ...pl,
              vet_profile: resolveVetProfile(pl.vet_profile),
              vet_treatment_steps: (pl.vet_treatment_steps || []).sort(
                (a: VetTreatmentStep, b: VetTreatmentStep) => a.step_number - b.step_number
              ),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching prontuario data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, selectedDogId]);

  // Toggle treatment step completion
  const toggleStepComplete = async (step: VetTreatmentStep) => {
    if (!user) return;

    const wasCompleted = !!step.completed_at;
    const newCompletedAt = wasCompleted ? null : new Date().toISOString();
    const newCompletedBy = wasCompleted ? null : user.id;

    try {
      const { error } = await supabase
        .from("vet_treatment_steps")
        .update({
          completed_at: newCompletedAt,
          completed_by: newCompletedBy,
        })
        .eq("id", step.id);

      if (error) throw error;

      // Update local state
      setTreatmentPlans((prev) =>
        prev.map((plan) => ({
          ...plan,
          vet_treatment_steps: plan.vet_treatment_steps.map((s) =>
            s.id === step.id
              ? { ...s, completed_at: newCompletedAt }
              : s
          ),
        }))
      );

      toast.success(wasCompleted ? "Etapa desmarcada" : "Etapa concluida!");
    } catch (error) {
      console.error("Error toggling step:", error);
      toast.error("Erro ao atualizar etapa");
    }
  };

  // Filter helpers
  const filteredNotes = useMemo(() => {
    switch (activeTab) {
      case "consultas":
        return vetNotes.filter((n) => n.note_type === "consulta");
      case "vacinas":
        return vetNotes.filter((n) => n.note_type === "vacina");
      case "exames":
        return vetNotes.filter((n) => n.note_type === "exame");
      default:
        return vetNotes;
    }
  }, [vetNotes, activeTab]);

  const showNotes = activeTab === "todos" || activeTab === "consultas" || activeTab === "vacinas" || activeTab === "exames";
  const showPrescriptions = activeTab === "todos" || activeTab === "prescricoes";
  const showMedications = activeTab === "todos" || activeTab === "medicamentos";
  const showTreatments = activeTab === "todos" || activeTab === "tratamentos";

  const totalItems =
    vetNotes.length + medications.length + prescriptions.length + treatmentPlans.length;

  // ---- Render ----

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="page-container flex flex-col items-center justify-center gap-items">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (dogs.length === 0) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Cadastre um cao primeiro.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Prontuario</h1>
            <p className="text-sm text-muted-foreground">
              Historico veterinario de {selectedDog?.name || "seu cao"}
            </p>
          </div>
          <DogSelector />
        </div>

        {/* Content with premium gate */}
        <FeatureGateBlur
          feature="prontuario"
          overlayText="Desbloqueie o prontuario digital completo"
        >
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex overflow-x-auto no-scrollbar h-auto p-1">
              <TabsTrigger value="todos" className="text-xs flex-shrink-0">
                Todos
              </TabsTrigger>
              <TabsTrigger value="consultas" className="text-xs flex-shrink-0">
                Consultas
              </TabsTrigger>
              <TabsTrigger value="vacinas" className="text-xs flex-shrink-0">
                Vacinas
              </TabsTrigger>
              <TabsTrigger value="exames" className="text-xs flex-shrink-0">
                Exames
              </TabsTrigger>
              <TabsTrigger value="prescricoes" className="text-xs flex-shrink-0">
                Prescricoes
              </TabsTrigger>
              <TabsTrigger value="medicamentos" className="text-xs flex-shrink-0">
                Medicamentos
              </TabsTrigger>
              <TabsTrigger value="tratamentos" className="text-xs flex-shrink-0">
                Tratamentos
              </TabsTrigger>
            </TabsList>

            {/* Loading state */}
            {isLoading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Stethoscope className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum registro veterinario encontrado.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os registros aparecerao quando seu veterinario adicionar notas, prescricoes ou tratamentos.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {/* Vet Notes */}
                {showNotes &&
                  filteredNotes.map((note) => (
                    <Card key={`note-${note.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              NOTE_TYPE_COLORS[note.note_type] || "bg-muted"
                            }`}
                          >
                            {NOTE_TYPE_ICONS[note.note_type] || (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                              </Badge>
                              {note.scheduled_date && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(parseISO(note.scheduled_date), "dd/MM/yyyy")}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm truncate">
                              {note.title}
                            </p>
                            {note.content && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {note.content}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[11px] text-muted-foreground">
                                {note.vet_profile
                                  ? `Dr(a). ${note.vet_profile.name}${
                                      note.vet_profile.clinic_name
                                        ? ` - ${note.vet_profile.clinic_name}`
                                        : ""
                                    }`
                                  : "Veterinario"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {format(parseISO(note.created_at), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>

                            {/* Attachments */}
                            {note.vet_note_attachments.length > 0 && (
                              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                                {note.vet_note_attachments.map((att) => (
                                  <button
                                    key={att.id}
                                    onClick={() => setPreviewAttachment(att)}
                                    className="flex-shrink-0 w-14 h-14 rounded-lg bg-muted/50 border border-border/50 overflow-hidden press-effect"
                                  >
                                    {att.file_type === "image" ? (
                                      <img
                                        src={att.file_url}
                                        alt={att.file_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {/* Prescriptions */}
                {showPrescriptions &&
                  prescriptions.map((presc) => (
                    <Card key={`presc-${presc.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg flex-shrink-0 bg-orange-500/10 text-orange-600">
                            <ClipboardList className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-[10px]">
                                Prescricao
                              </Badge>
                              {presc.is_active && (
                                <Badge className="bg-green-500/10 text-green-600 border-0 text-[10px]">
                                  Ativa
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm truncate">
                              {presc.title}
                            </p>
                            {presc.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {presc.notes}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {presc.total_kcal_target && (
                                <span className="text-[11px] text-muted-foreground">
                                  Meta: {presc.total_kcal_target} kcal/dia
                                </span>
                              )}
                              {presc.meals_per_day && (
                                <span className="text-[11px] text-muted-foreground">
                                  {presc.meals_per_day} refeicoes/dia
                                </span>
                              )}
                              {presc.valid_until && (
                                <span className="text-[11px] text-muted-foreground">
                                  Valido ate {format(parseISO(presc.valid_until), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[11px] text-muted-foreground">
                                {presc.vet_profile
                                  ? `Dr(a). ${presc.vet_profile.name}${
                                      presc.vet_profile.clinic_name
                                        ? ` - ${presc.vet_profile.clinic_name}`
                                        : ""
                                    }`
                                  : "Veterinario"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {format(parseISO(presc.created_at), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {/* Medications */}
                {showMedications &&
                  medications.map((med) => (
                    <Card key={`med-${med.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg flex-shrink-0 bg-pink-500/10 text-pink-600">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-[10px]">
                                Medicamento
                              </Badge>
                              {med.is_active && (
                                <Badge className="bg-green-500/10 text-green-600 border-0 text-[10px]">
                                  Em andamento
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm truncate">
                              {med.medication_name}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                              {med.dosage && (
                                <span className="text-xs text-muted-foreground">
                                  Dose: {med.dosage}
                                </span>
                              )}
                              {med.frequency && (
                                <span className="text-xs text-muted-foreground">
                                  Freq: {med.frequency}
                                </span>
                              )}
                              {med.duration_days && (
                                <span className="text-xs text-muted-foreground">
                                  {med.duration_days} dias
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-[11px] text-muted-foreground">
                                Inicio: {format(parseISO(med.start_date), "dd/MM/yyyy")}
                              </span>
                              {med.end_date && (
                                <span className="text-[11px] text-muted-foreground">
                                  Fim: {format(parseISO(med.end_date), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                            {med.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {med.notes}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[11px] text-muted-foreground">
                                {med.vet_profile
                                  ? `Dr(a). ${med.vet_profile.name}${
                                      med.vet_profile.clinic_name
                                        ? ` - ${med.vet_profile.clinic_name}`
                                        : ""
                                    }`
                                  : "Veterinario"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {format(parseISO(med.created_at), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {/* Treatment Plans */}
                {showTreatments &&
                  treatmentPlans.map((plan) => {
                    const totalSteps = plan.vet_treatment_steps.length;
                    const completedSteps = plan.vet_treatment_steps.filter(
                      (s) => s.completed_at
                    ).length;

                    return (
                      <Card key={`plan-${plan.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg flex-shrink-0 bg-indigo-500/10 text-indigo-600">
                              <ClipboardList className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-[10px]">
                                  Tratamento
                                </Badge>
                                <Badge
                                  className={`text-[10px] border-0 ${
                                    plan.status === "active"
                                      ? "bg-green-500/10 text-green-600"
                                      : plan.status === "completed"
                                      ? "bg-blue-500/10 text-blue-600"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {plan.status === "active"
                                    ? "Em andamento"
                                    : plan.status === "completed"
                                    ? "Concluido"
                                    : "Cancelado"}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm truncate">
                                {plan.title}
                              </p>
                              {plan.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {plan.description}
                                </p>
                              )}

                              {/* Progress */}
                              {totalSteps > 0 && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] text-muted-foreground">
                                      Progresso
                                    </span>
                                    <span className="text-[11px] font-medium">
                                      {completedSteps}/{totalSteps}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all duration-300"
                                      style={{
                                        width: `${
                                          totalSteps > 0
                                            ? (completedSteps / totalSteps) * 100
                                            : 0
                                        }%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Steps checklist */}
                              {totalSteps > 0 && (
                                <div className="mt-3 space-y-2">
                                  {plan.vet_treatment_steps.map((step) => (
                                    <button
                                      key={step.id}
                                      onClick={() => toggleStepComplete(step)}
                                      className="w-full flex items-start gap-2 text-left press-effect"
                                    >
                                      {step.completed_at ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`text-xs font-medium ${
                                            step.completed_at
                                              ? "line-through text-muted-foreground"
                                              : ""
                                          }`}
                                        >
                                          {step.title}
                                        </p>
                                        {step.description && (
                                          <p className="text-[11px] text-muted-foreground truncate">
                                            {step.description}
                                          </p>
                                        )}
                                        {step.target_date && (
                                          <p className="text-[10px] text-muted-foreground">
                                            Previsto: {format(parseISO(step.target_date), "dd/MM/yyyy")}
                                          </p>
                                        )}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2">
                                <p className="text-[11px] text-muted-foreground">
                                  {plan.vet_profile
                                    ? `Dr(a). ${plan.vet_profile.name}${
                                        plan.vet_profile.clinic_name
                                          ? ` - ${plan.vet_profile.clinic_name}`
                                          : ""
                                      }`
                                    : "Veterinario"}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {format(parseISO(plan.created_at), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                {/* Empty state per tab */}
                {activeTab === "consultas" && filteredNotes.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma consulta registrada.
                  </p>
                )}
                {activeTab === "vacinas" && filteredNotes.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma vacina registrada.
                  </p>
                )}
                {activeTab === "exames" && filteredNotes.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum exame registrado.
                  </p>
                )}
                {activeTab === "prescricoes" && prescriptions.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma prescricao registrada.
                  </p>
                )}
                {activeTab === "medicamentos" && medications.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum medicamento registrado.
                  </p>
                )}
                {activeTab === "tratamentos" && treatmentPlans.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum tratamento registrado.
                  </p>
                )}
              </div>
            )}
          </Tabs>
        </FeatureGateBlur>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground px-4 pt-4">
          Registros adicionados pelo seu veterinario vinculado. Consulte seu profissional para duvidas.
        </p>
      </div>

      {/* Fullscreen Attachment Preview Dialog */}
      <Dialog
        open={!!previewAttachment}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      >
        <DialogContent className="max-w-[95vw] max-h-[90dvh] p-0 overflow-hidden bg-black/95 border-0">
          {previewAttachment && (
            <div className="relative w-full h-full flex items-center justify-center min-h-[50vh]">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 press-effect"
              >
                <X className="w-5 h-5" />
              </button>
              {previewAttachment.file_type === "image" ? (
                <img
                  src={previewAttachment.file_url}
                  alt={previewAttachment.file_name}
                  className="max-w-full max-h-[85dvh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white">
                  <FileText className="w-12 h-12" />
                  <p className="text-sm">{previewAttachment.file_name}</p>
                  <a
                    href={previewAttachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm underline"
                  >
                    Abrir arquivo
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Prontuario;
