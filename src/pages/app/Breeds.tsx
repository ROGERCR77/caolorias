import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { Search, Info, Zap, Scale, Loader2 } from "lucide-react";

const porteLabels: Record<string, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
  gigante: "Gigante",
};

const porteColors: Record<string, string> = {
  pequeno: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  medio: "bg-green-500/10 text-green-600 border-green-500/20",
  grande: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  gigante: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const energiaLabels: Record<string, string> = {
  baixa: "Baixa",
  moderada: "Moderada",
  alta: "Alta",
};

const energiaColors: Record<string, string> = {
  baixa: "bg-emerald-500/10 text-emerald-600",
  moderada: "bg-amber-500/10 text-amber-600",
  alta: "bg-red-500/10 text-red-600",
};

const Breeds = () => {
  const { breedReferences, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBreed, setSelectedBreed] = useState<typeof breedReferences[0] | null>(null);

  const filteredBreeds = useMemo(() => {
    if (!searchQuery.trim()) return breedReferences;
    const query = searchQuery.toLowerCase();
    return breedReferences.filter((breed) =>
      breed.breed_name.toLowerCase().includes(query)
    );
  }, [breedReferences, searchQuery]);

  if (isLoading) {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Referências de Raças</h1>
          <p className="text-muted-foreground text-sm">
            Consulte informações sobre peso típico e nível de energia das principais raças
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Busque por uma raça (ex.: Labrador, Poodle, Shih Tzu...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Breeds list */}
        {filteredBreeds.length === 0 ? (
          <Card variant="elevated" className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">
                Nenhuma raça encontrada para "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBreeds.map((breed) => (
              <Card
                key={breed.id}
                variant="elevated"
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedBreed(breed)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-sm leading-tight">{breed.breed_name}</h3>
                    <Badge variant="outline" className={porteColors[breed.porte]}>
                      {porteLabels[breed.porte]}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" />
                      <span>{breed.peso_min_kg}–{breed.peso_max_kg} kg</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span className={energiaColors[breed.energia_padrao]}>
                        {energiaLabels[breed.energia_padrao]}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedBreed} onOpenChange={() => setSelectedBreed(null)}>
          <DialogContent className="sm:max-w-md bg-card">
            {selectedBreed && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{selectedBreed.breed_name}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={porteColors[selectedBreed.porte]}>
                      Porte {porteLabels[selectedBreed.porte]}
                    </Badge>
                    <Badge variant="outline" className={energiaColors[selectedBreed.energia_padrao]}>
                      Energia {energiaLabels[selectedBreed.energia_padrao]}
                    </Badge>
                    {selectedBreed.braquicefalico && (
                      <Badge variant="outline" className="bg-pink-500/10 text-pink-600">
                        Braquicefálico
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-4 h-4 text-primary" />
                      <span className="font-medium">Peso típico de adultos</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {selectedBreed.peso_min_kg} a {selectedBreed.peso_max_kg} kg
                    </p>
                  </div>

                  {selectedBreed.descricao_resumida && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedBreed.descricao_resumida}
                    </p>
                  )}

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-sm">
                    <Info className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                    <p className="text-amber-700 dark:text-amber-400">
                      Esses valores são apenas referências gerais para cães saudáveis. Cada cão é único, e apenas um médico-veterinário pode avaliar com precisão o peso e a saúde do seu animal.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedBreed(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Breeds;