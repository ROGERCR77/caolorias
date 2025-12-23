import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, subDays, parseISO, differenceInYears, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, FileText, Download, Dog as DogIcon,
  Scale, Utensils, Activity, Heart, Crown, Printer,
  Stethoscope, ClipboardList, Syringe, Calendar, MessageSquare
} from "lucide-react";
import { UpgradeModal } from "@/components/app/UpgradeModal";
import jsPDF from "jspdf";

interface VetNote {
  id: string;
  title: string;
  content: string | null;
  note_type: string;
  scheduled_date: string | null;
  created_at: string;
  vet_profile: {
    name: string;
    crmv: string;
    uf: string;
    clinic_name: string | null;
  };
}

interface LinkedVet {
  id: string;
  vet_profile: {
    name: string;
    crmv: string;
    uf: string;
    clinic_name: string | null;
  };
}

const NOTE_TYPE_ICONS: Record<string, React.ReactNode> = {
  consulta: <ClipboardList className="h-4 w-4" />,
  vacina: <Syringe className="h-4 w-4" />,
  exame: <FileText className="h-4 w-4" />,
  observacao: <MessageSquare className="h-4 w-4" />,
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  consulta: "Consulta",
  vacina: "Vacina",
  exame: "Exame",
  observacao: "Observação",
};

export default function VetReport() {
  const { user } = useAuth();
  const { selectedDogId, dogs, meals, weightLogs, foods, isLoading: dataLoading } = useData();
  const { isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [vetNotes, setVetNotes] = useState<VetNote[]>([]);
  const [linkedVets, setLinkedVets] = useState<LinkedVet[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Fetch vet notes for the selected dog
  useEffect(() => {
    if (!user || !selectedDogId) return;

    const fetchVetData = async () => {
      try {
        // Fetch linked vets and their notes
        const { data: links } = await supabase
          .from("vet_dog_links")
          .select(`
            id,
            vet_profile:vet_profiles!vet_dog_links_vet_profile_fkey(
              name, crmv, uf, clinic_name
            )
          `)
          .eq("dog_id", selectedDogId)
          .eq("tutor_user_id", user.id)
          .eq("status", "active");

        if (links) {
          const typedLinks = links.map(l => ({
            ...l,
            vet_profile: Array.isArray(l.vet_profile) ? l.vet_profile[0] : l.vet_profile,
          })).filter(l => l.vet_profile) as LinkedVet[];
          setLinkedVets(typedLinks);
        }

        // Fetch notes for this specific dog - more efficient query
        // Get link IDs for this dog first
        const linkIds = links?.map(l => l.id) || [];
        
        if (linkIds.length > 0) {
          const { data: notes } = await supabase
            .from("vet_notes")
            .select(`
              id,
              title,
              content,
              note_type,
              scheduled_date,
              created_at,
              vet_dog_link_id,
              vet_profile:vet_profiles!vet_notes_vet_profile_fkey(
                name, crmv, uf, clinic_name
              )
            `)
            .in("vet_dog_link_id", linkIds)
            .order("created_at", { ascending: false });

          if (notes) {
            const typedNotes = notes.map((n: any) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              note_type: n.note_type,
              scheduled_date: n.scheduled_date,
              created_at: n.created_at,
              vet_profile: Array.isArray(n.vet_profile) ? n.vet_profile[0] : n.vet_profile,
            })).filter((n: any) => n.vet_profile) as VetNote[];
            setVetNotes(typedNotes);
          }
        } else {
          setVetNotes([]);
        }
      } catch (error) {
        console.error("Error fetching vet data:", error);
      }
    };

    fetchVetData();
  }, [user, selectedDogId]);

  // Calculate dog age
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "Não informado";
    const birth = parseISO(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    if (years > 0) return `${years} ano${years > 1 ? 's' : ''} e ${months} mês${months !== 1 ? 'es' : ''}`;
    return `${months} mês${months !== 1 ? 'es' : ''}`;
  };

  // Load health data
  const loadHealthData = async () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    
    if (!user || !selectedDogId) return;
    
    setIsLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const [symptomsRes, poopRes, energyRes, activityRes, intolerancesRes] = await Promise.all([
        supabase.from('health_symptoms').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('poop_logs').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('energy_logs').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('activity_logs').select('*').eq('dog_id', selectedDogId).gte('logged_at', thirtyDaysAgo),
        supabase.from('food_intolerances').select('*').eq('dog_id', selectedDogId),
      ]);

      setHealthData({
        symptoms: symptomsRes.data || [],
        poopLogs: poopRes.data || [],
        energyLogs: energyRes.data || [],
        activityLogs: activityRes.data || [],
        intolerances: intolerancesRes.data || [],
      });
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    
    if (!selectedDog) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(74, 124, 89); // Primary color
      doc.text("Cãolorias - Relatório Veterinário", margin, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, y);
      y += 15;
      
      // Dog Info Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Dados do Pet", margin, y);
      y += 8;
      
      doc.setFontSize(11);
      doc.text(`Nome: ${selectedDog.name}`, margin, y);
      y += 6;
      doc.text(`Raça: ${selectedDog.breed || "SRD"}`, margin, y);
      y += 6;
      doc.text(`Idade: ${calculateAge(selectedDog.birth_date)}`, margin, y);
      y += 6;
      doc.text(`Peso Atual: ${selectedDog.current_weight_kg} kg`, margin, y);
      y += 6;
      doc.text(`Porte: ${selectedDog.size || "Não informado"}`, margin, y);
      y += 6;
      doc.text(`Tipo de Alimentação: ${selectedDog.feeding_type || "Natural"}`, margin, y);
      y += 15;
      
      // Weight History
      doc.setFontSize(14);
      doc.text("Histórico de Peso (últimos 30 dias)", margin, y);
      y += 8;
      
      const recentWeights = weightLogs
        .filter(w => w.dog_id === selectedDogId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      doc.setFontSize(10);
      if (recentWeights.length === 0) {
        doc.text("Sem registros de peso", margin, y);
        y += 6;
      } else {
        recentWeights.forEach(w => {
          doc.text(`${format(parseISO(w.date), "dd/MM/yyyy")} - ${w.weight_kg} kg`, margin, y);
          y += 5;
        });
      }
      y += 10;
      
      // Feeding Summary
      doc.setFontSize(14);
      doc.text("Resumo Alimentar", margin, y);
      y += 8;
      
      const recentMeals = meals
        .filter(m => m.dog_id === selectedDogId)
        .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
        .slice(0, 10);
      
      const avgMealKcal = recentMeals.length > 0 
        ? Math.round(recentMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0) / recentMeals.length)
        : 0;
      
      doc.setFontSize(10);
      doc.text(`Meta diária: ${selectedDog.meta_kcal_dia || '-'} kcal`, margin, y);
      y += 5;
      doc.text(`Média consumida: ${avgMealKcal} kcal`, margin, y);
      y += 5;
      doc.text(`Objetivo: ${selectedDog.objetivo?.replace('_', ' ') || 'Não informado'}`, margin, y);
      y += 5;
      doc.text(`Refeições registradas: ${recentMeals.length} (últimos 30 dias)`, margin, y);
      y += 15;
      
      // Health Data (if loaded)
      if (healthData) {
        // Poop Logs Summary
        if (healthData.poopLogs.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(14);
          doc.text("Saúde Digestiva - Fezes (30 dias)", margin, y);
          y += 8;
          
          doc.setFontSize(10);
          doc.text(`Total de registros: ${healthData.poopLogs.length}`, margin, y);
          y += 5;
          
          // Count textures
          const textureCounts: Record<string, number> = {};
          healthData.poopLogs.forEach((p: any) => {
            textureCounts[p.texture] = (textureCounts[p.texture] || 0) + 1;
          });
          const mainTexture = Object.entries(textureCounts).sort((a, b) => b[1] - a[1])[0];
          if (mainTexture) {
            doc.text(`Textura predominante: ${mainTexture[0]} (${mainTexture[1]}x)`, margin, y);
            y += 5;
          }
          
          const withBlood = healthData.poopLogs.filter((p: any) => p.has_blood).length;
          const withMucus = healthData.poopLogs.filter((p: any) => p.has_mucus).length;
          if (withBlood > 0) {
            doc.setTextColor(255, 0, 0);
            doc.text(`⚠️ Com sangue: ${withBlood} ocorrência(s)`, margin, y);
            doc.setTextColor(0, 0, 0);
            y += 5;
          }
          if (withMucus > 0) {
            doc.text(`Com muco: ${withMucus} ocorrência(s)`, margin, y);
            y += 5;
          }
          y += 10;
        }

        // Energy Logs Summary
        if (healthData.energyLogs.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(14);
          doc.text("Nível de Energia (30 dias)", margin, y);
          y += 8;
          
          doc.setFontSize(10);
          const energyCounts: Record<string, number> = {};
          healthData.energyLogs.forEach((e: any) => {
            energyCounts[e.energy_level] = (energyCounts[e.energy_level] || 0) + 1;
          });
          Object.entries(energyCounts).forEach(([level, count]) => {
            const levelLabel = level === 'muito_agitado' ? 'Muito agitado' : level === 'normal' ? 'Normal' : 'Muito quieto';
            doc.text(`${levelLabel}: ${count} dia(s)`, margin, y);
            y += 5;
          });
          y += 10;
        }

        // Intolerances
        if (healthData.intolerances.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(14);
          doc.text("Alergias/Intolerâncias", margin, y);
          y += 8;
          
          doc.setFontSize(10);
          healthData.intolerances.forEach((i: any) => {
            const foodName = i.food_name || foods.find(f => f.id === i.food_id)?.name || "Desconhecido";
            doc.text(`• ${foodName} (${i.reaction_type})`, margin, y);
            y += 5;
          });
          y += 10;
        }
        
        // Symptoms
        if (healthData.symptoms.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(14);
          doc.text("Sintomas Registrados (30 dias)", margin, y);
          y += 8;
          
          doc.setFontSize(10);
          healthData.symptoms.slice(0, 5).forEach((s: any) => {
            doc.text(`${format(parseISO(s.logged_at), "dd/MM")} - ${s.symptoms?.join(', ')}`, margin, y);
            y += 5;
          });
          y += 10;
        }
        
        // Activity
        if (healthData.activityLogs.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(14);
          doc.text("Atividade Física (30 dias)", margin, y);
          y += 8;
          
          const totalMinutes = healthData.activityLogs.reduce((sum: number, a: any) => sum + a.duration_minutes, 0);
          doc.setFontSize(10);
          doc.text(`Total de atividades: ${healthData.activityLogs.length}`, margin, y);
          y += 5;
          doc.text(`Tempo total: ${totalMinutes} minutos`, margin, y);
          y += 15;
        }
      }
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.text("Este relatório é apenas informativo e não substitui avaliação veterinária.", margin, footerY);
      doc.text("Gerado pelo Cãolorias - caolorias.app", margin, footerY + 5);
      
      // Save PDF
      doc.save(`relatorio-${selectedDog.name.toLowerCase().replace(/\s/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success("PDF baixado com sucesso!");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Print report
  const printReport = () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    window.print();
  };

  // Get recent meals
  const recentMeals = meals
    .filter(m => m.dog_id === selectedDogId)
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
    .slice(0, 10);

  // Get weight history
  const recentWeights = weightLogs
    .filter(w => w.dog_id === selectedDogId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Calculate averages
  const avgMealKcal = recentMeals.length > 0 
    ? Math.round(recentMeals.reduce((sum, m) => sum + (m.total_kcal_estimated || 0), 0) / recentMeals.length)
    : 0;

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (dogs.length === 0) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Cadastre um cão primeiro.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 pb-24 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Relatório para Veterinário</h1>
            <p className="text-sm text-muted-foreground">Exporte os dados do seu cão</p>
          </div>
          <DogSelector />
        </div>

        {/* Premium Badge */}
        {!isPremium && (
          <Card className="bg-gradient-to-r from-warning/10 to-accent/10 border-warning/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Crown className="h-6 w-6 text-warning" />
              <div className="flex-1">
                <p className="font-semibold">Recurso Premium</p>
                <p className="text-sm text-muted-foreground">
                  Assine para exportar relatórios completos
                </p>
              </div>
              <Button size="sm" onClick={() => setShowUpgrade(true)}>
                Assinar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 gap-2" 
            onClick={loadHealthData}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Gerar Relatório
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={generatePDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={printReport}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>

        {/* Report Preview */}
        <div ref={reportRef} className="space-y-4 print:p-4" id="vet-report">
          {/* Dog Info */}
          {selectedDog && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DogIcon className="h-4 w-4" />
                  Dados do Pet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-semibold">{selectedDog.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Raça</p>
                    <p className="font-semibold">{selectedDog.breed || "SRD"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Idade</p>
                    <p className="font-semibold">{calculateAge(selectedDog.birth_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peso Atual</p>
                    <p className="font-semibold">{selectedDog.current_weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Porte</p>
                    <p className="font-semibold capitalize">{selectedDog.size}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Alimentação</p>
                    <p className="font-semibold capitalize">{selectedDog.feeding_type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Veterinarian Notes Section */}
          {(vetNotes.length > 0 || linkedVets.length > 0) && (
            <Card className="border-blue-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-500" />
                  Anotações do Veterinário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {linkedVets.map(vet => (
                  <Badge key={vet.id} variant="secondary" className="gap-1 mr-2">
                    <Stethoscope className="h-3 w-3" />
                    {vet.vet_profile.name} - CRMV {vet.vet_profile.crmv}/{vet.vet_profile.uf}
                  </Badge>
                ))}
                {vetNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma anotação ainda.</p>
                ) : (
                  vetNotes.slice(0, 5).map(note => (
                    <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                      <Badge variant="outline" className="text-xs mb-1">
                        {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                      </Badge>
                      <p className="font-medium">{note.title}</p>
                      {note.content && <p className="text-sm text-muted-foreground">{note.content}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(note.created_at), "dd/MM/yyyy", { locale: ptBR })} - Dr(a). {note.vet_profile.name}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Weight History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Histórico de Peso (últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentWeights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registros</p>
              ) : (
                <div className="space-y-1">
                  {recentWeights.slice(0, 5).map(w => (
                    <div key={w.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(parseISO(w.date), "dd/MM/yyyy")}
                      </span>
                      <span className="font-semibold">{w.weight_kg} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feeding Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Resumo Alimentar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Meta diária</p>
                  <p className="font-semibold">{selectedDog?.meta_kcal_dia || '-'} kcal</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Média consumida</p>
                  <p className="font-semibold">{avgMealKcal} kcal</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Objetivo</p>
                  <p className="font-semibold capitalize">{selectedDog?.objetivo?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Refeições registradas</p>
                  <p className="font-semibold">{recentMeals.length} (30 dias)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Data (if loaded) */}
          {healthData && (
            <>
              {/* Intolerances */}
              {healthData.intolerances.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      Alergias/Intolerâncias Registradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {healthData.intolerances.map((i: any) => (
                        <Badge key={i.id} variant="destructive">
                          {i.food_name || foods.find(f => f.id === i.food_id)?.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Symptoms */}
              {healthData.symptoms.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sintomas Registrados (30 dias)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {healthData.symptoms.slice(0, 5).map((s: any) => (
                        <div key={s.id} className="flex justify-between text-sm">
                          <span>{s.symptoms?.join(', ')}</span>
                          <span className="text-muted-foreground">
                            {format(parseISO(s.logged_at), "dd/MM")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Poop Logs Summary */}
              {healthData.poopLogs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      💩 Saúde Digestiva - Fezes (30 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total de registros</span>
                        <span className="font-semibold">{healthData.poopLogs.length}</span>
                      </div>
                      {(() => {
                        const textureCounts: Record<string, number> = {};
                        healthData.poopLogs.forEach((p: any) => {
                          textureCounts[p.texture] = (textureCounts[p.texture] || 0) + 1;
                        });
                        const entries = Object.entries(textureCounts).sort((a, b) => b[1] - a[1]);
                        return entries.slice(0, 3).map(([texture, count]) => (
                          <div key={texture} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{texture}</span>
                            <span className="font-semibold">{count}x</span>
                          </div>
                        ));
                      })()}
                      {healthData.poopLogs.filter((p: any) => p.has_blood).length > 0 && (
                        <div className="flex justify-between text-destructive">
                          <span>⚠️ Com sangue</span>
                          <span className="font-semibold">{healthData.poopLogs.filter((p: any) => p.has_blood).length}x</span>
                        </div>
                      )}
                      {healthData.poopLogs.filter((p: any) => p.has_mucus).length > 0 && (
                        <div className="flex justify-between text-warning">
                          <span>Com muco</span>
                          <span className="font-semibold">{healthData.poopLogs.filter((p: any) => p.has_mucus).length}x</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Energy Logs Summary */}
              {healthData.energyLogs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      ⚡ Nível de Energia (30 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const energyCounts: Record<string, number> = {};
                        healthData.energyLogs.forEach((e: any) => {
                          energyCounts[e.energy_level] = (energyCounts[e.energy_level] || 0) + 1;
                        });
                        const levelLabels: Record<string, string> = {
                          muito_agitado: 'Muito agitado',
                          normal: 'Normal', 
                          muito_quieto: 'Muito quieto'
                        };
                        return Object.entries(energyCounts).map(([level, count]) => (
                          <div key={level} className="flex justify-between">
                            <span className="text-muted-foreground">{levelLabels[level] || level}</span>
                            <span className="font-semibold">{count} dia(s)</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Activity Summary */}
              {healthData.activityLogs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Atividade Física (30 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total atividades</p>
                        <p className="font-semibold">{healthData.activityLogs.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tempo total</p>
                        <p className="font-semibold">
                          {healthData.activityLogs.reduce((sum: number, a: any) => sum + a.duration_minutes, 0)} min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Report footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>Relatório gerado pelo Cãolorias em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p className="mt-1">Este relatório é apenas informativo e não substitui avaliação veterinária.</p>
          </div>
        </div>
        
        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature="pdf_export"
        />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #vet-report, #vet-report * { visibility: visible; }
          #vet-report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </AppLayout>
  );
}
