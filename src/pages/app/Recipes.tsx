import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "@/components/app/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChefHat, Crown, Loader2 } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  total_grams: number | null;
  total_kcal: number | null;
  servings: number | null;
}

const Recipes = () => {
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, [user]);

  const fetchRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error: any) {
      console.error("Error fetching recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRecipe = () => {
    if (!isPremium) {
      setShowUpgrade(true);
      return;
    }
    toast({
      title: "Em breve!",
      description: "A criação de receitas será liberada em breve.",
    });
  };

  // Demo recipes for free users
  const demoRecipes: Recipe[] = [
    {
      id: "demo-1",
      name: "Frango com Arroz e Legumes",
      description: "Receita básica equilibrada para cães adultos",
      total_grams: 500,
      total_kcal: 650,
      servings: 2,
    },
    {
      id: "demo-2",
      name: "Carne Moída com Batata Doce",
      description: "Opção nutritiva e saborosa",
      total_grams: 400,
      total_kcal: 520,
      servings: 2,
    },
    {
      id: "demo-3",
      name: "Mix de Proteínas com Vegetais",
      description: "Variedade de proteínas e fibras",
      total_grams: 450,
      total_kcal: 580,
      servings: 2,
    },
  ];

  const displayRecipes = isPremium ? recipes : demoRecipes;

  return (
    <AppLayout>
      <div className="container px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ChefHat className="w-6 h-6" />
              Receitas
            </h1>
            <p className="text-muted-foreground">
              Suas receitas de alimentação natural
            </p>
          </div>
          <Button onClick={handleNewRecipe}>
            {!isPremium && <Crown className="w-4 h-4 mr-1" />}
            <Plus className="w-4 h-4 mr-1" />
            Nova Receita
          </Button>
        </div>

        {!isPremium && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-warning" />
                  <span className="text-sm">
                    Plano Grátis: visualize 3 receitas de exemplo
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowUpgrade(true)}>
                  Ver Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayRecipes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma receita ainda</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Crie suas primeiras receitas de alimentação natural
              </p>
              <Button onClick={handleNewRecipe}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Receita
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayRecipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !isPremium ? "opacity-75" : ""
                }`}
                onClick={() => {
                  if (!isPremium) {
                    setShowUpgrade(true);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {recipe.name}
                    {!isPremium && (
                      <Badge variant="outline" className="text-xs">
                        Exemplo
                      </Badge>
                    )}
                  </CardTitle>
                  {recipe.description && (
                    <CardDescription>{recipe.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {recipe.total_grams && (
                      <span>{recipe.total_grams}g</span>
                    )}
                    {recipe.total_kcal && (
                      <span>{recipe.total_kcal} kcal</span>
                    )}
                    {recipe.servings && (
                      <span>{recipe.servings} porções</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <UpgradeModal 
          open={showUpgrade} 
          onOpenChange={setShowUpgrade}
          feature="recipes"
        />
      </div>
    </AppLayout>
  );
};

export default Recipes;
