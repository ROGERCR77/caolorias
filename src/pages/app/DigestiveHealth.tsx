import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { compressImage, formatFileSize } from "@/lib/imageCompression";
import { 
  Loader2, 
  Plus, 
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Camera,
  Image as ImageIcon,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Types
interface PoopLog {
  id: string;
  dog_id: string;
  texture: string;
  color: string;
  has_mucus: boolean;
  has_blood: boolean;
  notes: string | null;
  logged_at: string;
  photo_url?: string | null;
}

interface HealthSymptom {
  id: string;
  dog_id: string;
  symptoms: string[];
  severity: string;
  notes: string | null;
  logged_at: string;
  photo_url?: string | null;
}

interface EnergyLog {
  id: string;
  dog_id: string;
  energy_level: string;
  notes: string | null;
  logged_at: string;
  photo_url?: string | null;
}

// Texture and color options
const TEXTURES = [
  { value: 'duro', label: '🪨 Duro', color: 'bg-amber-700' },
  { value: 'firme', label: '✅ Firme', color: 'bg-amber-600' },
  { value: 'normal', label: '👍 Normal', color: 'bg-amber-500' },
  { value: 'mole', label: '💧 Mole', color: 'bg-amber-400' },
  { value: 'diarreia', label: '⚠️ Diarreia', color: 'bg-amber-300' },
];

const COLORS = [
  { value: 'marrom', label: 'Marrom', color: 'bg-amber-800' },
  { value: 'escuro', label: 'Escuro', color: 'bg-stone-800' },
  { value: 'claro', label: 'Claro', color: 'bg-amber-300' },
  { value: 'amarelo', label: 'Amarelo', color: 'bg-yellow-400' },
  { value: 'vermelho', label: 'Vermelho', color: 'bg-red-500' },
  { value: 'preto', label: 'Preto', color: 'bg-black' },
];

const SYMPTOMS = [
  { value: 'vomito', label: '🤢 Vômito' },
  { value: 'apatia', label: '😔 Apatia' },
  { value: 'coceira', label: '🐾 Coceira' },
  { value: 'diarreia', label: '💧 Diarreia' },
  { value: 'perda_apetite', label: '🍽️ Perda de apetite' },
  { value: 'tosse', label: '😷 Tosse' },
  { value: 'espirro', label: '🤧 Espirro' },
];

const SEVERITIES = [
  { value: 'leve', label: 'Leve', color: 'bg-green-500' },
  { value: 'moderado', label: 'Moderado', color: 'bg-yellow-500' },
  { value: 'grave', label: 'Grave', color: 'bg-red-500' },
];

const ENERGY_LEVELS = [
  { value: 'muito_agitado', label: '🚀 Muito agitado', description: 'Cheio de energia!' },
  { value: 'normal', label: '😊 Normal', description: 'Energia equilibrada' },
  { value: 'muito_quieto', label: '😴 Muito quieto', description: 'Mais parado que o normal' },
];

export default function DigestiveHealth() {
  const { user } = useAuth();
  const { selectedDogId, dogs, isLoading: dataLoading } = useData();
  const [isLoading, setIsLoading] = useState(true);
  const [poopLogs, setPoopLogs] = useState<PoopLog[]>([]);
  const [symptoms, setSymptoms] = useState<HealthSymptom[]>([]);
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]);
  
  // Form states
  const [poopDialogOpen, setPoopDialogOpen] = useState(false);
  const [symptomDialogOpen, setSymptomDialogOpen] = useState(false);
  const [energyDialogOpen, setEnergyDialogOpen] = useState(false);
  
  const [selectedTexture, setSelectedTexture] = useState('normal');
  const [selectedColor, setSelectedColor] = useState('marrom');
  const [hasMucus, setHasMucus] = useState(false);
  const [hasBlood, setHasBlood] = useState(false);
  const [poopNotes, setPoopNotes] = useState('');
  const [poopPhoto, setPoopPhoto] = useState<File | null>(null);
  const [poopPhotoPreview, setPoopPhotoPreview] = useState<string | null>(null);
  
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState('leve');
  const [symptomNotes, setSymptomNotes] = useState('');
  const [symptomPhoto, setSymptomPhoto] = useState<File | null>(null);
  const [symptomPhotoPreview, setSymptomPhotoPreview] = useState<string | null>(null);
  
  const [selectedEnergy, setSelectedEnergy] = useState('normal');
  const [energyNotes, setEnergyNotes] = useState('');
  const [energyPhoto, setEnergyPhoto] = useState<File | null>(null);
  const [energyPhotoPreview, setEnergyPhotoPreview] = useState<string | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // File input refs
  const poopFileInputRef = useRef<HTMLInputElement>(null);
  const symptomFileInputRef = useRef<HTMLInputElement>(null);
  const energyFileInputRef = useRef<HTMLInputElement>(null);

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Photo upload function with compression
  const uploadPhoto = async (file: File, folder: string): Promise<string | null> => {
    try {
      setUploadingPhoto(true);
      
      // Compress image before upload
      const originalSize = file.size;
      const compressedBlob = await compressImage(file, 1200, 0.8);
      const compressedSize = compressedBlob.size;
      
      console.log(`Image compressed: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`);
      
      const fileName = `${user!.id}/${folder}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear photo
  const clearPhoto = (
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Fetch data
  useEffect(() => {
    if (!user || !selectedDogId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [poopRes, symptomsRes, energyRes] = await Promise.all([
          supabase
            .from('poop_logs')
            .select('*')
            .eq('dog_id', selectedDogId)
            .order('logged_at', { ascending: false })
            .limit(30),
          supabase
            .from('health_symptoms')
            .select('*')
            .eq('dog_id', selectedDogId)
            .order('logged_at', { ascending: false })
            .limit(30),
          supabase
            .from('energy_logs')
            .select('*')
            .eq('dog_id', selectedDogId)
            .order('logged_at', { ascending: false })
            .limit(30),
        ]);

        if (poopRes.data) setPoopLogs(poopRes.data);
        if (symptomsRes.data) setSymptoms(symptomsRes.data);
        if (energyRes.data) setEnergyLogs(energyRes.data);
      } catch (error) {
        console.error('Error fetching health data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, selectedDogId]);

  // Save poop log
  const savePoopLog = async () => {
    if (!user || !selectedDogId) return;
    
    try {
      let photoUrl: string | null = null;
      if (poopPhoto) {
        photoUrl = await uploadPhoto(poopPhoto, 'poop-logs');
      }

      const { data, error } = await supabase.from('poop_logs').insert({
        dog_id: selectedDogId,
        user_id: user.id,
        texture: selectedTexture,
        color: selectedColor,
        has_mucus: hasMucus,
        has_blood: hasBlood,
        notes: poopNotes || null,
        photo_url: photoUrl,
      }).select().single();

      if (error) throw error;

      toast.success('Registro salvo!');
      setPoopDialogOpen(false);
      resetPoopForm();
      
      // Update local state instead of refetching
      if (data) {
        setPoopLogs(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error saving poop log:', error);
      toast.error('Erro ao salvar registro');
    }
  };

  // Save symptom
  const saveSymptom = async () => {
    if (!user || !selectedDogId || selectedSymptoms.length === 0) return;
    
    try {
      let photoUrl: string | null = null;
      if (symptomPhoto) {
        photoUrl = await uploadPhoto(symptomPhoto, 'health-symptoms');
      }

      const { data, error } = await supabase.from('health_symptoms').insert({
        dog_id: selectedDogId,
        user_id: user.id,
        symptoms: selectedSymptoms,
        severity: selectedSeverity,
        notes: symptomNotes || null,
        photo_url: photoUrl,
      }).select().single();

      if (error) throw error;

      toast.success('Sintomas registrados!');
      setSymptomDialogOpen(false);
      resetSymptomForm();
      
      // Update local state instead of refetching
      if (data) {
        setSymptoms(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error saving symptoms:', error);
      toast.error('Erro ao salvar sintomas');
    }
  };

  // Save energy log
  const saveEnergyLog = async () => {
    if (!user || !selectedDogId) return;
    
    try {
      let photoUrl: string | null = null;
      if (energyPhoto) {
        photoUrl = await uploadPhoto(energyPhoto, 'energy-logs');
      }

      const { data, error } = await supabase.from('energy_logs').insert({
        dog_id: selectedDogId,
        user_id: user.id,
        energy_level: selectedEnergy,
        notes: energyNotes || null,
        photo_url: photoUrl,
      }).select().single();

      if (error) throw error;

      toast.success('Energia registrada!');
      setEnergyDialogOpen(false);
      resetEnergyForm();
      
      // Update local state instead of refetching
      if (data) {
        setEnergyLogs(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error saving energy log:', error);
      toast.error('Erro ao salvar registro');
    }
  };

  // Delete functions
  const deletePoopLog = async (id: string) => {
    try {
      const { error } = await supabase.from('poop_logs').delete().eq('id', id);
      if (error) throw error;
      setPoopLogs(prev => prev.filter(p => p.id !== id));
      toast.success('Registro excluído');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const deleteSymptom = async (id: string) => {
    try {
      const { error } = await supabase.from('health_symptoms').delete().eq('id', id);
      if (error) throw error;
      setSymptoms(prev => prev.filter(s => s.id !== id));
      toast.success('Registro excluído');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const deleteEnergyLog = async (id: string) => {
    try {
      const { error } = await supabase.from('energy_logs').delete().eq('id', id);
      if (error) throw error;
      setEnergyLogs(prev => prev.filter(e => e.id !== id));
      toast.success('Registro excluído');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  // Reset forms
  const resetPoopForm = () => {
    setSelectedTexture('normal');
    setSelectedColor('marrom');
    setHasMucus(false);
    setHasBlood(false);
    setPoopNotes('');
    setPoopPhoto(null);
    setPoopPhotoPreview(null);
  };

  const resetSymptomForm = () => {
    setSelectedSymptoms([]);
    setSelectedSeverity('leve');
    setSymptomNotes('');
    setSymptomPhoto(null);
    setSymptomPhotoPreview(null);
  };

  const resetEnergyForm = () => {
    setSelectedEnergy('normal');
    setEnergyNotes('');
    setEnergyPhoto(null);
    setEnergyPhotoPreview(null);
  };

  // Calculate weekly summary
  const getWeeklySummary = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekPoops = poopLogs.filter(p => new Date(p.logged_at) >= weekAgo);
    const hasProblems = weekPoops.some(p => 
      p.texture === 'diarreia' || p.texture === 'mole' || 
      p.has_blood || p.has_mucus ||
      p.color === 'vermelho' || p.color === 'preto'
    );

    const weekSymptoms = symptoms.filter(s => new Date(s.logged_at) >= weekAgo);
    
    if (hasProblems || weekSymptoms.length > 0) {
      return { status: 'alert', message: 'Sinais de atenção detectados' };
    }
    
    if (weekPoops.length === 0) {
      return { status: 'neutral', message: 'Sem registros esta semana' };
    }
    
    return { status: 'ok', message: 'Tudo bem esta semana!' };
  };

  const summary = getWeeklySummary();

  // Photo upload button component
  const PhotoUploadButton = ({ 
    photo, 
    preview, 
    onClear, 
    inputRef,
    onSelect 
  }: { 
    photo: File | null;
    preview: string | null;
    onClear: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium">Foto (opcional)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSelect}
      />
      {preview ? (
        <div className="relative inline-block">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-24 h-24 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploadingPhoto}
        >
          <Camera className="h-4 w-4" />
          Adicionar foto
        </Button>
      )}
    </div>
  );

  if (dataLoading || isLoading) {
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
          <p className="text-muted-foreground">Cadastre um cão primeiro para usar esta funcionalidade.</p>
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
            <h1 className="text-xl font-bold">Saúde Digestiva</h1>
            <p className="text-sm text-muted-foreground">Acompanhe a saúde do seu cão</p>
          </div>
          <DogSelector />
        </div>

        {/* Weekly Summary Card */}
        <Card className={`border-2 ${
          summary.status === 'ok' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
          summary.status === 'alert' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
          'border-muted'
        }`}>
          <CardContent className="p-4 flex items-center gap-3">
            {summary.status === 'ok' ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : summary.status === 'alert' ? (
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            ) : (
              <Circle className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold">Resumo da Semana</p>
              <p className="text-sm text-muted-foreground">{summary.message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="poop" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="poop">💩 Cocô</TabsTrigger>
            <TabsTrigger value="symptoms">🤒 Sintomas</TabsTrigger>
            <TabsTrigger value="energy">⚡ Energia</TabsTrigger>
          </TabsList>

          {/* Poop Tab */}
          <TabsContent value="poop" className="space-y-4">
            <Dialog open={poopDialogOpen} onOpenChange={setPoopDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Cocô
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Registrar Cocô de {selectedDog?.name}</DialogTitle>
                  <DialogDescription>
                    Registre textura, cor e outras características
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
                  {/* Texture */}
                  <div>
                    <p className="text-sm font-medium mb-2">Textura</p>
                    <div className="flex flex-wrap gap-2">
                      {TEXTURES.map(t => (
                        <Button
                          key={t.value}
                          variant={selectedTexture === t.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTexture(t.value)}
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <p className="text-sm font-medium mb-2">Cor</p>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(c => (
                        <Button
                          key={c.value}
                          variant={selectedColor === c.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedColor(c.value)}
                          className="gap-2"
                        >
                          <span className={`w-3 h-3 rounded-full ${c.color}`} />
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="flex gap-4">
                    <Button
                      variant={hasMucus ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setHasMucus(!hasMucus)}
                    >
                      🔬 Com muco
                    </Button>
                    <Button
                      variant={hasBlood ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setHasBlood(!hasBlood)}
                    >
                      🩸 Com sangue
                    </Button>
                  </div>

                  {/* Photo Upload */}
                  <PhotoUploadButton
                    photo={poopPhoto}
                    preview={poopPhotoPreview}
                    onClear={() => clearPhoto(setPoopPhoto, setPoopPhotoPreview, poopFileInputRef)}
                    inputRef={poopFileInputRef}
                    onSelect={(e) => handleFileSelect(e, setPoopPhoto, setPoopPhotoPreview)}
                  />

                  {/* Notes */}
                  <div>
                    <p className="text-sm font-medium mb-2">Observações (opcional)</p>
                    <Textarea 
                      value={poopNotes}
                      onChange={(e) => setPoopNotes(e.target.value)}
                      placeholder="Algo mais a notar?"
                    />
                  </div>

                  <Button className="w-full" onClick={savePoopLog} disabled={uploadingPhoto}>
                    {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar Registro
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Poop History */}
            <div className="space-y-2">
              {poopLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro ainda</p>
              ) : (
                poopLogs.map(log => (
                  <Card key={log.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {TEXTURES.find(t => t.value === log.texture)?.label}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <span className={`w-2 h-2 rounded-full ${COLORS.find(c => c.value === log.color)?.color}`} />
                            {COLORS.find(c => c.value === log.color)?.label}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {log.has_mucus && <Badge variant="destructive" className="text-xs">Com muco</Badge>}
                          {log.has_blood && <Badge variant="destructive" className="text-xs">Com sangue</Badge>}
                        </div>
                        {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                        {log.photo_url && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs gap-1"
                            onClick={() => setViewingPhoto(log.photo_url!)}
                          >
                            <ImageIcon className="h-3 w-3" />
                            Ver foto
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.logged_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deletePoopLog(log.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Symptoms Tab */}
          <TabsContent value="symptoms" className="space-y-4">
            <Dialog open={symptomDialogOpen} onOpenChange={setSymptomDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2" variant="secondary">
                  <Plus className="h-4 w-4" />
                  Registrar Sintomas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Registrar Sintomas de {selectedDog?.name}</DialogTitle>
                  <DialogDescription>
                    Selecione os sintomas observados e a gravidade
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
                  {/* Symptoms */}
                  <div>
                    <p className="text-sm font-medium mb-2">O que está acontecendo?</p>
                    <div className="flex flex-wrap gap-2">
                      {SYMPTOMS.map(s => (
                        <Button
                          key={s.value}
                          variant={selectedSymptoms.includes(s.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedSymptoms(prev => 
                              prev.includes(s.value) 
                                ? prev.filter(x => x !== s.value)
                                : [...prev, s.value]
                            );
                          }}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Severity */}
                  <div>
                    <p className="text-sm font-medium mb-2">Gravidade</p>
                    <div className="flex gap-2">
                      {SEVERITIES.map(s => (
                        <Button
                          key={s.value}
                          variant={selectedSeverity === s.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSeverity(s.value)}
                          className="gap-2"
                        >
                          <span className={`w-2 h-2 rounded-full ${s.color}`} />
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <PhotoUploadButton
                    photo={symptomPhoto}
                    preview={symptomPhotoPreview}
                    onClear={() => clearPhoto(setSymptomPhoto, setSymptomPhotoPreview, symptomFileInputRef)}
                    inputRef={symptomFileInputRef}
                    onSelect={(e) => handleFileSelect(e, setSymptomPhoto, setSymptomPhotoPreview)}
                  />

                  {/* Notes */}
                  <div>
                    <p className="text-sm font-medium mb-2">Observações (opcional)</p>
                    <Textarea 
                      value={symptomNotes}
                      onChange={(e) => setSymptomNotes(e.target.value)}
                      placeholder="Desde quando? Algum alimento novo?"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={saveSymptom}
                    disabled={selectedSymptoms.length === 0 || uploadingPhoto}
                  >
                    {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar Sintomas
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Symptoms History */}
            <div className="space-y-2">
              {symptoms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum sintoma registrado</p>
              ) : (
                symptoms.map(symptom => (
                  <Card key={symptom.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          {symptom.symptoms.map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {SYMPTOMS.find(x => x.value === s)?.label || s}
                            </Badge>
                          ))}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            symptom.severity === 'grave' ? 'border-red-500 text-red-500' :
                            symptom.severity === 'moderado' ? 'border-yellow-500 text-yellow-500' :
                            'border-green-500 text-green-500'
                          }`}
                        >
                          {SEVERITIES.find(s => s.value === symptom.severity)?.label}
                        </Badge>
                        {symptom.notes && <p className="text-xs text-muted-foreground">{symptom.notes}</p>}
                        {symptom.photo_url && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs gap-1"
                            onClick={() => setViewingPhoto(symptom.photo_url!)}
                          >
                            <ImageIcon className="h-3 w-3" />
                            Ver foto
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(symptom.logged_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteSymptom(symptom.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Energy Tab */}
          <TabsContent value="energy" className="space-y-4">
            <Dialog open={energyDialogOpen} onOpenChange={setEnergyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2" variant="secondary">
                  <Plus className="h-4 w-4" />
                  Registrar Energia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Como está {selectedDog?.name} hoje?</DialogTitle>
                  <DialogDescription>
                    Registre o nível de energia do seu cão
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
                  {/* Energy Level */}
                  <div className="space-y-2">
                    {ENERGY_LEVELS.map(e => (
                      <Button
                        key={e.value}
                        variant={selectedEnergy === e.value ? "default" : "outline"}
                        className="w-full justify-start h-auto py-3"
                        onClick={() => setSelectedEnergy(e.value)}
                      >
                        <div className="text-left">
                          <p className="font-medium">{e.label}</p>
                          <p className="text-xs text-muted-foreground">{e.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {/* Photo Upload */}
                  <PhotoUploadButton
                    photo={energyPhoto}
                    preview={energyPhotoPreview}
                    onClear={() => clearPhoto(setEnergyPhoto, setEnergyPhotoPreview, energyFileInputRef)}
                    inputRef={energyFileInputRef}
                    onSelect={(e) => handleFileSelect(e, setEnergyPhoto, setEnergyPhotoPreview)}
                  />

                  {/* Notes */}
                  <div>
                    <p className="text-sm font-medium mb-2">Observações (opcional)</p>
                    <Textarea 
                      value={energyNotes}
                      onChange={(e) => setEnergyNotes(e.target.value)}
                      placeholder="Algo diferente hoje?"
                    />
                  </div>

                  <Button className="w-full" onClick={saveEnergyLog} disabled={uploadingPhoto}>
                    {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Energy History */}
            <div className="space-y-2">
              {energyLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de energia</p>
              ) : (
                energyLogs.map(log => (
                  <Card key={log.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">
                          {ENERGY_LEVELS.find(e => e.value === log.energy_level)?.label}
                        </p>
                        {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                        {log.photo_url && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs gap-1"
                            onClick={() => setViewingPhoto(log.photo_url!)}
                          >
                            <ImageIcon className="h-3 w-3" />
                            Ver foto
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.logged_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteEnergyLog(log.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground px-4 pt-4">
          Estes registros ajudam você a acompanhar a saúde do seu cão. Em caso de sinais preocupantes, consulte um médico-veterinário.
        </p>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-lg p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto</DialogTitle>
          </DialogHeader>
          {viewingPhoto && (
            <img 
              src={viewingPhoto} 
              alt="Foto do registro" 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
