import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useData, Food } from "@/contexts/DataContext";
import { Plus, Edit2, Trash2, Apple, Drumstick, Wheat, Carrot, Cookie, Package, Loader2, Info, Heart, Droplets, Pill, Sparkles, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FoodSearchCombobox, FoodReferenceWithMacros } from "@/components/app/FoodSearchCombobox";

// Expanded category config with new categories
const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  protein: { label: "Proteína", icon: Drumstick, color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
  viscera: { label: "Víscera", icon: Heart, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
  carb: { label: "Carboidrato", icon: Wheat, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
  vegetable: { label: "Vegetal", icon: Carrot, color: "text-green-500 bg-green-50 dark:bg-green-900/20" },
  fat: { label: "Gordura", icon: Droplets, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" },
  supplement: { label: "Suplemento", icon: Pill, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
  extra: { label: "Extra", icon: Sparkles, color: "text-pink-500 bg-pink-50 dark:bg-pink-900/20" },
  kibble: { label: "Ração", icon: Package, color: "text-slate-500 bg-slate-50 dark:bg-slate-900/20" },
  treat: { label: "Petisco", icon: Cookie, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20" },
  other: { label: "Outro", icon: Apple, color: "text-gray-500 bg-gray-50 dark:bg-gray-900/20" },
};

// Map category_main from food_reference to our categories
const categoryMainToCategory: Record<string, Food["category"]> = {
  PROTEINA: "protein",
  VISCERA: "viscera",
  CARBO: "carb",
  VEGETAL: "vegetable",
  GORDURA: "fat",
  SUPLEMENTO: "supplement",
  EXTRA: "extra",
};

const unitLabels: Record<string, string> = {
  GRAMA: "gramas",
  UNIDADE: "unidade",
  COLHER_SOPA: "colher de sopa",
  COLHER_CHA: "colher de chá",
  XICARA: "xícara",
};

const costLabels: Record<string, { label: string; icon: string }> = {
  BAIXO: { label: "Baixo custo", icon: "💰" },
  MEDIO: { label: "Custo médio", icon: "💰💰" },
  ALTO: { label: "Custo alto", icon: "💰💰💰" },
};

const Foods = () => {
  const { foods, addFood, updateFood, deleteFood, isLoading: dataLoading } = useData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "custom">("search");
  const [selectedFoodRef, setSelectedFoodRef] = useState<FoodReferenceWithMacros | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "protein" as Food["category"],
    kcal_per_100g: "",
    notes: "",
    unit_type: "GRAMA",
    grams_per_unit: "",
    protein_g: "",
    fat_g: "",
    carb_g: "",
    cost_level: "MEDIO",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "protein",
      kcal_per_100g: "",
      notes: "",
      unit_type: "GRAMA",
      grams_per_unit: "",
      protein_g: "",
      fat_g: "",
      carb_g: "",
      cost_level: "MEDIO",
    });
    setEditingFood(null);
    setSelectedFoodRef(null);
    setActiveTab("search");
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
      unit_type: (food as any).unit_type || "GRAMA",
      grams_per_unit: (food as any).grams_per_unit?.toString() || "",
      protein_g: (food as any).protein_g?.toString() || "",
      fat_g: (food as any).fat_g?.toString() || "",
      carb_g: (food as any).carb_g?.toString() || "",
      cost_level: (food as any).cost_level || "MEDIO",
    });
    setActiveTab("custom");
    setIsDialogOpen(true);
  };

  // Auto-fill form when selecting from reference
  const handleFoodRefSelect = (food: FoodReferenceWithMacros | null) => {
    setSelectedFoodRef(food);
    if (food) {
      const category = categoryMainToCategory[food.category_main] || "other";
      setFormData({
        name: food.name,
        category,
        kcal_per_100g: food.macros?.per_100g_kcal?.toString() || "",
        notes: food.notes_simple || "",
        unit_type: food.default_unit,
        grams_per_unit: food.unit_gram_equivalence?.toString() || "",
        protein_g: food.macros?.per_100g_protein_g?.toString() || "",
        fat_g: food.macros?.per_100g_fat_g?.toString() || "",
        carb_g: food.macros?.per_100g_carb_g?.toString() || "",
        cost_level: food.cost_level,
      });
    }
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
        unit_type: formData.unit_type,
        grams_per_unit: formData.grams_per_unit ? parseFloat(formData.grams_per_unit) : null,
        protein_g: formData.protein_g ? parseFloat(formData.protein_g) : null,
        fat_g: formData.fat_g ? parseFloat(formData.fat_g) : null,
        carb_g: formData.carb_g ? parseFloat(formData.carb_g) : null,
        cost_level: formData.cost_level,
        reference_food_id: selectedFoodRef?.id || null,
      };

      if (editingFood) {
        await updateFood(editingFood.id, foodData);
        toast({
          title: "Alimento atualizado!",
          description: `${foodData.name} foi atualizado.`,
        });
      } else {
        await addFood(foodData as any);
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
        <div className="page-container flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container page-content">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-items">
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
              <DialogContent className="sm:max-w-lg bg-card max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-40px)] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>
                    {editingFood ? "Editar alimento" : "Adicionar alimento"}
                  </DialogTitle>
                </DialogHeader>
                
                {!editingFood && (
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "search" | "custom")} className="flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="search" className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Buscar
                      </TabsTrigger>
                      <TabsTrigger value="custom" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Personalizado
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto keyboard-scroll-container space-y-4 pb-[100px]">
                  {activeTab === "search" && !editingFood && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Buscar alimento na base de dados</Label>
                        <FoodSearchCombobox
                          selectedFood={selectedFoodRef}
                          onSelect={handleFoodRefSelect}
                          onCreateCustom={() => setActiveTab("custom")}
                          disabled={isSubmitting}
                        />
                        <p className="text-xs text-muted-foreground">
                          Selecione um alimento e os dados nutricionais serão preenchidos automaticamente.
                        </p>
                      </div>

                      {selectedFoodRef && (
                        <Card className="bg-muted/50">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{selectedFoodRef.name}</span>
                              <Badge variant="secondary">
                                {costLabels[selectedFoodRef.cost_level]?.icon} {costLabels[selectedFoodRef.cost_level]?.label}
                              </Badge>
                            </div>
                            
                            {selectedFoodRef.macros && (
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-background rounded-lg p-2">
                                  <div className="text-lg font-bold">{selectedFoodRef.macros.per_100g_kcal}</div>
                                  <div className="text-xs text-muted-foreground">kcal</div>
                                </div>
                                <div className="bg-background rounded-lg p-2">
                                  <div className="text-lg font-bold text-red-500">{selectedFoodRef.macros.per_100g_protein_g}g</div>
                                  <div className="text-xs text-muted-foreground">proteína</div>
                                </div>
                                <div className="bg-background rounded-lg p-2">
                                  <div className="text-lg font-bold text-yellow-500">{selectedFoodRef.macros.per_100g_fat_g}g</div>
                                  <div className="text-xs text-muted-foreground">gordura</div>
                                </div>
                                <div className="bg-background rounded-lg p-2">
                                  <div className="text-lg font-bold text-amber-600">{selectedFoodRef.macros.per_100g_carb_g}g</div>
                                  <div className="text-xs text-muted-foreground">carbo</div>
                                </div>
                              </div>
                            )}

                            {selectedFoodRef.default_unit !== "GRAMA" && selectedFoodRef.unit_gram_equivalence && (
                              <div className="text-sm text-muted-foreground">
                                📏 1 {unitLabels[selectedFoodRef.default_unit]} ≈ {selectedFoodRef.unit_gram_equivalence}g
                              </div>
                            )}

                            {selectedFoodRef.notes_simple && (
                              <div className="text-sm bg-accent/20 rounded-lg p-2">
                                💡 {selectedFoodRef.notes_simple}
                              </div>
                            )}

                            {selectedFoodRef.cautions && (
                              <div className="text-sm text-amber-600 dark:text-amber-400">
                                ⚠️ {selectedFoodRef.cautions}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {(activeTab === "custom" || editingFood) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do alimento *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Frango cozido"
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
                          <Label>Custo</Label>
                          <Select
                            value={formData.cost_level}
                            onValueChange={(v) => setFormData({ ...formData, cost_level: v })}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              <SelectItem value="BAIXO">💰 Baixo</SelectItem>
                              <SelectItem value="MEDIO">💰💰 Médio</SelectItem>
                              <SelectItem value="ALTO">💰💰💰 Alto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Medida padrão</Label>
                          <Select
                            value={formData.unit_type}
                            onValueChange={(v) => setFormData({ ...formData, unit_type: v })}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                              <SelectItem value="GRAMA">Gramas</SelectItem>
                              <SelectItem value="UNIDADE">Unidade</SelectItem>
                              <SelectItem value="COLHER_SOPA">Colher de sopa</SelectItem>
                              <SelectItem value="COLHER_CHA">Colher de chá</SelectItem>
                              <SelectItem value="XICARA">Xícara</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.unit_type !== "GRAMA" && (
                          <div className="space-y-2">
                            <Label htmlFor="grams_per_unit">Gramas por unidade</Label>
                            <Input
                              id="grams_per_unit"
                              type="number"
                              value={formData.grams_per_unit}
                              onChange={(e) => setFormData({ ...formData, grams_per_unit: e.target.value })}
                              placeholder="Ex: 50"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Informação nutricional (por 100g)</Label>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Input
                              type="number"
                              value={formData.kcal_per_100g}
                              onChange={(e) => setFormData({ ...formData, kcal_per_100g: e.target.value })}
                              placeholder="kcal"
                              disabled={isSubmitting}
                            />
                            <span className="text-xs text-muted-foreground">kcal</span>
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={formData.protein_g}
                              onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })}
                              placeholder="prot"
                              disabled={isSubmitting}
                            />
                            <span className="text-xs text-muted-foreground">proteína (g)</span>
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={formData.fat_g}
                              onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })}
                              placeholder="gord"
                              disabled={isSubmitting}
                            />
                            <span className="text-xs text-muted-foreground">gordura (g)</span>
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={formData.carb_g}
                              onChange={(e) => setFormData({ ...formData, carb_g: e.target.value })}
                              placeholder="carb"
                              disabled={isSubmitting}
                            />
                            <span className="text-xs text-muted-foreground">carbo (g)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Ex: Cozinhar sem sal. Desfiar antes de servir."
                          rows={2}
                          disabled={isSubmitting}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      variant="accent" 
                      className="flex-1" 
                      disabled={isSubmitting || (activeTab === "search" && !selectedFoodRef && !editingFood)}
                    >
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
                  Use a busca para encontrar alimentos com informações nutricionais já preenchidas, ou crie alimentos personalizados. 
                  Para alimentação natural, use sempre alimentos <strong>sem tempero, sem sal, sem cebola, sem alho</strong>.
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
              const config = categoryConfig[food.category] || categoryConfig.other;
              const Icon = config.icon;
              const costLevel = (food as any).cost_level;
              const unitType = (food as any).unit_type;
              const gramsPerUnit = (food as any).grams_per_unit;
              const proteinG = (food as any).protein_g;
              const fatG = (food as any).fat_g;
              const carbG = (food as any).carb_g;
              
              return (
                <Card key={food.id} variant="interactive" className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.color} shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{food.name}</h3>
                          {costLevel && (
                            <span className="text-xs">{costLabels[costLevel]?.icon}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mt-1">
                          <span>{config.label}</span>
                          {food.kcal_per_100g && (
                            <>
                              <span>•</span>
                              <span>{food.kcal_per_100g} kcal/100g</span>
                            </>
                          )}
                          {unitType && unitType !== "GRAMA" && gramsPerUnit && (
                            <>
                              <span>•</span>
                              <span>1 {unitLabels[unitType]} ≈ {gramsPerUnit}g</span>
                            </>
                          )}
                        </div>
                        {(proteinG || fatG || carbG) && (
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            {proteinG > 0 && <span className="text-red-500">{proteinG}g prot</span>}
                            {fatG > 0 && <span className="text-yellow-500">{fatG}g gord</span>}
                            {carbG > 0 && <span className="text-amber-600">{carbG}g carb</span>}
                          </div>
                        )}
                        {food.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{food.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
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
