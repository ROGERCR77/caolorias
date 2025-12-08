import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useData, Food } from "@/contexts/DataContext";
import { Plus, Edit2, Trash2, Apple, Drumstick, Wheat, Carrot, Cookie, Package, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryConfig = {
  protein: { label: "Proteína", icon: Drumstick, color: "text-red-500 bg-red-50" },
  carb: { label: "Carboidrato", icon: Wheat, color: "text-amber-600 bg-amber-50" },
  vegetable: { label: "Vegetal", icon: Carrot, color: "text-green-500 bg-green-50" },
  kibble: { label: "Ração", icon: Package, color: "text-blue-500 bg-blue-50" },
  treat: { label: "Petisco", icon: Cookie, color: "text-pink-500 bg-pink-50" },
  other: { label: "Outro", icon: Apple, color: "text-gray-500 bg-gray-50" },
};

const Foods = () => {
  const { foods, addFood, updateFood, deleteFood, isLoading: dataLoading } = useData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "protein" as Food["category"],
    kcal_per_100g: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "protein",
      kcal_per_100g: "",
      notes: "",
    });
    setEditingFood(null);
  };

  const openNewFoodDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditFoodDialog = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      category: food.category,
      kcal_per_100g: food.kcal_per_100g?.toString() || "",
      notes: food.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do alimento.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const foodData = {
        name: formData.name.trim(),
        category: formData.category,
        kcal_per_100g: formData.kcal_per_100g ? parseInt(formData.kcal_per_100g) : null,
        notes: formData.notes.trim() || null,
      };

      if (editingFood) {
        await updateFood(editingFood.id, foodData);
        toast({
          title: "Alimento atualizado!",
          description: `${foodData.name} foi atualizado.`,
        });
      } else {
        await addFood(foodData);
        toast({
          title: "Alimento cadastrado!",
          description: `${foodData.name} foi adicionado à sua lista.`,
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Algo deu errado",
        description: "Tente novamente. Se o problema continuar, entre em contato com o suporte.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (food: Food) => {
    if (confirm(`Tem certeza que deseja remover "${food.name}"?`)) {
      try {
        await deleteFood(food.id);
        toast({
          title: "Alimento removido",
          description: `${food.name} foi removido.`,
        });
      } catch (error: any) {
        toast({
          title: "Algo deu errado",
          description: "Tente novamente. Se o problema continuar, entre em contato com o suporte.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredFoods = filterCategory === "all" 
    ? foods 
    : foods.filter((f) => f.category === filterCategory);

  if (dataLoading) {
    return (
      <AppLayout>
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Alimentos</h1>
          <div className="flex gap-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewFoodDialog}>
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card">
                <DialogHeader>
                  <DialogTitle>
                    {editingFood ? "Editar alimento" : "Adicionar alimento"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do alimento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Frango cozido, sem pele e sem tempero"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v as Food["category"] })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {Object.entries(categoryConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kcal">kcal por 100g</Label>
                      <Input
                        id="kcal"
                        type="number"
                        value={formData.kcal_per_100g}
                        onChange={(e) => setFormData({ ...formData, kcal_per_100g: e.target.value })}
                        placeholder="Ex: 165"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Se não souber, pode deixar em branco. Esse valor é apenas uma estimativa.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ex: Cozinhar em água sem sal. Desfiar antes de servir."
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="accent" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar alimento"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info card */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Cadastre aqui os alimentos que você usa na rotina do seu cão. Para alimentação natural, use sempre alimentos <strong>sem tempero, sem sal, sem cebola, sem alho</strong> e sem condimentos tóxicos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredFoods.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-light flex items-center justify-center">
                <Apple className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {filterCategory === "all" ? "Nenhum alimento cadastrado" : "Nenhum alimento nessa categoria"}
              </h2>
              <p className="text-muted-foreground mb-4">
                Adicione os alimentos que seu cão consome para facilitar o registro das refeições.
              </p>
              {filterCategory === "all" && (
                <Button onClick={openNewFoodDialog} variant="hero">
                  <Plus className="w-4 h-4" />
                  Adicionar primeiro alimento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredFoods.map((food) => {
              const config = categoryConfig[food.category];
              const Icon = config.icon;
              return (
                <Card key={food.id} variant="interactive" className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{food.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{config.label}</span>
                          {food.kcal_per_100g && (
                            <>
                              <span>•</span>
                              <span>{food.kcal_per_100g} kcal/100g</span>
                            </>
                          )}
                        </div>
                        {food.notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{food.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditFoodDialog(food)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(food)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Foods;
