import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DogSelector } from "@/components/app/DogSelector";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, Plus, Trash2, Syringe, Bug, Calendar, 
  AlertTriangle, CheckCircle2, Camera, Image, Crown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UpgradeModal } from "@/components/app/UpgradeModal";

interface HealthRecord {
  id: string;
  dog_id: string;
  type: string;
  name: string;
  applied_at: string;
  next_due_at: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

const RECORD_TYPES = [
  { value: 'vacina', label: '💉 Vacina', icon: Syringe },
  { value: 'vermifugo', label: '💊 Vermífugo', icon: Bug },
  { value: 'antipulgas', label: '🛡️ Antipulgas/Carrapato', icon: Bug },
  { value: 'outro', label: '📋 Outro', icon: Calendar },
];

const COMMON_VACCINES = [
  'V8', 'V10', 'Raiva', 'Gripe Canina', 'Giárdia', 'Leishmaniose'
];

const COMMON_VERMIFUGES = [
  'Drontal', 'Milbemax', 'Endogard', 'Canex', 'Outro'
];

const COMMON_ANTIPULGAS = [
  'Bravecto', 'NexGard', 'Simparic', 'Frontline', 'Revolution', 'Outro'
];

export default function HealthWallet() {
  const { user } = useAuth();
  const { selectedDogId, dogs, isLoading: dataLoading } = useData();
  const { isPremium } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  // Form state
  const [recordType, setRecordType] = useState('vacina');
  const [recordName, setRecordName] = useState('');
  const [appliedAt, setAppliedAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nextDueAt, setNextDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectedDog = dogs.find(d => d.id === selectedDogId);

  // Fetch records - must be before any conditional returns
  useEffect(() => {
    if (!user || !selectedDogId || !isPremium) return;
    
    const fetchRecords = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('applied_at', { ascending: false });

      if (data) setRecords(data);
      setIsLoading(false);
    };

    fetchRecords();
  }, [user, selectedDogId, isPremium]);

  // Get suggestions based on type
  const getSuggestions = () => {
    switch (recordType) {
      case 'vacina': return COMMON_VACCINES;
      case 'vermifugo': return COMMON_VERMIFUGES;
      case 'antipulgas': return COMMON_ANTIPULGAS;
      default: return [];
    }
  };

  // Check premium access - AFTER all hooks
  if (!isPremium) {
    return (
      <AppLayout>
        <div className="container px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Carteira de Saúde</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              Registre vacinas, vermífugos e antipulgas com lembretes automáticos. Recurso exclusivo do plano Premium.
            </p>
            <Button onClick={() => setShowUpgrade(true)} variant="hero">
              <Crown className="w-4 h-4 mr-2" />
              Assinar Premium
            </Button>
            <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="health_wallet" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Upload photo
  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${user.id}/${selectedDogId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('dog-photos')
      .upload(fileName, photoFile);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('dog-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  // Save record
  const saveRecord = async () => {
    if (!user || !selectedDogId || !recordName) return;
    
    setUploading(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const { error } = await supabase.from('health_records').insert({
        dog_id: selectedDogId,
        user_id: user.id,
        type: recordType,
        name: recordName,
        applied_at: appliedAt,
        next_due_at: nextDueAt || null,
        notes: notes || null,
        photo_url: photoUrl,
      });

      if (error) throw error;

      toast.success('Registro salvo!');
      setDialogOpen(false);
      resetForm();
      
      // Refresh
      const { data } = await supabase
        .from('health_records')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('applied_at', { ascending: false });
      if (data) setRecords(data);
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Erro ao salvar registro');
    } finally {
      setUploading(false);
    }
  };

  // Delete record
  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from('health_records').delete().eq('id', id);
      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Registro excluído');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setRecordType('vacina');
    setRecordName('');
    setAppliedAt(format(new Date(), 'yyyy-MM-dd'));
    setNextDueAt('');
    setNotes('');
    setPhotoFile(null);
  };

  // Get upcoming records (next 30 days)
  const upcomingRecords = records.filter(r => {
    if (!r.next_due_at) return false;
    const dueDate = parseISO(r.next_due_at);
    return isBefore(new Date(), dueDate) && isBefore(dueDate, addDays(new Date(), 30));
  });

  // Get overdue records
  const overdueRecords = records.filter(r => {
    if (!r.next_due_at) return false;
    return isBefore(parseISO(r.next_due_at), new Date());
  });

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
            <h1 className="text-xl font-bold">Carteira de Saúde</h1>
            <p className="text-sm text-muted-foreground">Vacinas, vermífugos e mais</p>
          </div>
          <DogSelector />
        </div>

        {/* Alerts */}
        {overdueRecords.length > 0 && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-300">Atenção!</p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {overdueRecords.length} {overdueRecords.length === 1 ? 'aplicação vencida' : 'aplicações vencidas'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {upcomingRecords.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">Próximas aplicações</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {upcomingRecords.length} nos próximos 30 dias
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Novo Registro de Saúde</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 py-4 pb-[100px]">
              {/* Type */}
              <div>
                <p className="text-sm font-medium mb-2">Tipo</p>
                <Select value={recordType} onValueChange={setRecordType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name with suggestions */}
              <div>
                <p className="text-sm font-medium mb-2">Nome</p>
                <Input 
                  value={recordName}
                  onChange={(e) => setRecordName(e.target.value)}
                  placeholder="Ex: V10, Bravecto..."
                />
                {getSuggestions().length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {getSuggestions().map(s => (
                      <Badge 
                        key={s} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setRecordName(s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Applied date */}
              <div>
                <p className="text-sm font-medium mb-2">Data da aplicação</p>
                <Input 
                  type="date"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                />
              </div>

              {/* Next due date */}
              <div>
                <p className="text-sm font-medium mb-2">Próxima aplicação (opcional)</p>
                <Input 
                  type="date"
                  value={nextDueAt}
                  onChange={(e) => setNextDueAt(e.target.value)}
                />
              </div>

              {/* Photo */}
              <div>
                <p className="text-sm font-medium mb-2">Foto do cartão (opcional)</p>
                <div className="flex gap-2">
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                </div>
                {photoFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📷 {photoFile.name}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <p className="text-sm font-medium mb-2">Observações (opcional)</p>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Veterinário, clínica, reações..."
                />
              </div>

              <Button 
                className="w-full" 
                onClick={saveRecord}
                disabled={!recordName || uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Registro
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Records List */}
        <div className="space-y-2">
          {records.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro ainda. Adicione vacinas, vermífugos e antipulgas.
            </p>
          ) : (
            records.map(record => {
              const isOverdue = record.next_due_at && isBefore(parseISO(record.next_due_at), new Date());
              const typeInfo = RECORD_TYPES.find(t => t.value === record.type);
              
              return (
                <Card key={record.id} className={isOverdue ? 'border-red-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{typeInfo?.label || record.type}</Badge>
                          <span className="font-semibold">{record.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Aplicado em {format(parseISO(record.applied_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        {record.next_due_at && (
                          <p className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                            {isOverdue ? '⚠️ Vencido em' : 'Próxima:'} {format(parseISO(record.next_due_at), "dd/MM/yyyy")}
                          </p>
                        )}
                        {record.notes && (
                          <p className="text-xs text-muted-foreground">{record.notes}</p>
                        )}
                        {record.photo_url && (
                          <a 
                            href={record.photo_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary"
                          >
                            <Image className="h-3 w-3" />
                            Ver foto
                          </a>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteRecord(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground px-4 pt-4">
          Mantenha seu cão sempre em dia com as vacinas e medicamentos. Consulte seu veterinário.
        </p>
      </div>
    </AppLayout>
  );
}
