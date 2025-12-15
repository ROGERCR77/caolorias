import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData, Dog, DogObjetivo, calculateAgeInMonths } from "@/contexts/DataContext";
import { Plus, Edit2, Trash2, Dog as DogIcon, Loader2, Crown, X, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { usePlanLimits } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/app/UpgradeModal";
import { FoodIntolerancesCard } from "@/components/app/FoodIntolerancesCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DogFormWizard, DogFormData } from "@/components/app/DogFormWizard";

const sizeLabels: Record<string, string> = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  giant: "Gigante",
};

const feedingTypeLabels: Record<string, string> = {
  natural: "Natural",
  kibble: "Ração",
  mixed: "Mista",
};

const objetivoLabels: Record<DogObjetivo, string> = {
  manter_peso: "Manter peso",
  perder_peso: "Perder peso",
  ganhar_peso: "Ganhar peso",
  alimentacao_saudavel: "Alimentação saudável",
};

const Dogs = () => {
  const { dogs, addDog, updateDog, deleteDog, isLoading: dataLoading, getBreedByName } = useData();
  const { toast } = useToast();
  const { isPremium } = useSubscription();
  const planLimits = usePlanLimits();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const canAddMoreDogs = dogs.length < planLimits.max_dogs;

  const openNewDogDialog = () => {
    setEditingDog(null);
    setIsDialogOpen(true);
  };

  const openEditDogDialog = (dog: Dog) => {
    setEditingDog(dog);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (formData: DogFormData) => {
    const dogData = {
      name: formData.name.trim(),
      breed: formData.breed.trim(),
      birth_date: formData.birth_date || null,
      current_weight_kg: parseFloat(formData.current_weight_kg) || 0,
      size: formData.size,
      sex: formData.sex,
      feeding_type: formData.feeding_type,
      objetivo: formData.objetivo,
      nivel_atividade: formData.nivel_atividade as Dog["nivel_atividade"],
      condicao_corporal: formData.condicao_corporal as Dog["condicao_corporal"],
      meta_kcal_dia: formData.meta_kcal_dia ? parseFloat(formData.meta_kcal_dia) : null,
      meta_gramas_dia: formData.meta_gramas_dia ? parseFloat(formData.meta_gramas_dia) : null,
      photo_url: formData.photo_url || null,
      is_puppy: formData.is_puppy || false,
      estimated_adult_weight_kg: formData.estimated_adult_weight_kg ? parseFloat(formData.estimated_adult_weight_kg) : null,
    };

    if (editingDog) {
      await updateDog(editingDog.id, dogData);
      toast({
        title: "Cão atualizado!",
        description: `${dogData.name} foi atualizado com sucesso.`,
      });
    } else {
      await addDog(dogData);
      toast({
        title: "Cão cadastrado!",
        description: `${dogData.name} foi adicionado!`,
      });
    }

    setIsDialogOpen(false);
    setEditingDog(null);
  };

  const handleDelete = async (dog: Dog) => {
    if (confirm(`Tem certeza que deseja remover ${dog.name}? Todas as refeições e registros serão perdidos.`)) {
      try {
        await deleteDog(dog.id);
        toast({
          title: "Cão removido",
          description: `${dog.name} foi removido.`,
        });
      } catch (error: any) {
        toast({
          title: "Algo deu errado",
          description: "Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="page-container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Meus cães</h1>
          <Button 
            onClick={() => {
              if (!canAddMoreDogs) {
                setShowUpgrade(true);
              } else {
                openNewDogDialog();
              }
            }}
          >
            <Plus className="w-4 h-4" />
            Adicionar
            {!canAddMoreDogs && <Crown className="w-3 h-3 ml-1 text-warning" />}
          </Button>
        </div>

        {/* Fullscreen Wizard Sheet */}
        <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl">
            <SheetHeader className="flex flex-row items-center justify-between pb-2">
              <SheetTitle>{editingDog ? "Editar cão" : "Adicionar cão"}</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </SheetHeader>
            <DogFormWizard
              editingDog={editingDog}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDialogOpen(false)}
              getBreedByName={getBreedByName}
            />
          </SheetContent>
        </Sheet>

        {dogs.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
                <DogIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Nenhum cão cadastrado</h2>
              <p className="text-muted-foreground mb-4">
                Comece adicionando seu primeiro amigo de quatro patas!
              </p>
              <Button onClick={openNewDogDialog} variant="hero">
                <Plus className="w-4 h-4" />
                Adicionar meu primeiro cão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="card-grid card-grid-sm-2 card-grid-lg-3">
            {dogs.map((dog) => (
              <Card key={dog.id} variant="interactive">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center overflow-hidden">
                        {dog.photo_url ? (
                          <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                        ) : (
                          <DogIcon className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{dog.name}</CardTitle>
                          {dog.is_puppy && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              <Baby className="w-3 h-3" />
                              Filhote
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{dog.breed || "Sem raça definida"}</p>
                        {dog.is_puppy && dog.birth_date && (
                          <p className="text-xs text-primary">{calculateAgeInMonths(dog.birth_date) || 0} meses</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso atual</span>
                      <span className="font-medium">{dog.current_weight_kg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sexo</span>
                      <span className="font-medium">
                        {dog.sex === 'femea' ? '♀ Fêmea' : '♂ Macho'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Porte</span>
                      <span className="font-medium">{sizeLabels[dog.size]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alimentação</span>
                      <span className="font-medium">{feedingTypeLabels[dog.feeding_type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Objetivo</span>
                      <span className="font-medium">{objetivoLabels[dog.objetivo]}</span>
                    </div>
                    {dog.meta_kcal_dia && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meta diária</span>
                        <span className="font-medium text-primary">{dog.meta_kcal_dia} kcal</span>
                      </div>
                    )}
                  </div>

                  {/* Food Intolerances */}
                  <div className="mt-4 pt-4 border-t">
                    <FoodIntolerancesCard dogId={dog.id} />
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDogDialog(dog)}
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(dog)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature="multiple_dogs"
        />
      </div>
    </AppLayout>
  );
};

export default Dogs;
