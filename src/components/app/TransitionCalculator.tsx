import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Utensils, Leaf, Scale } from "lucide-react";

interface TransitionCalculatorProps {
  metaGramasDia: number | null;
  kibblePercentage: number;
  naturalPercentage: number;
  proteinPercent?: number;
  carbPercent?: number;
  vegPercent?: number;
}

export function TransitionCalculator({
  metaGramasDia,
  kibblePercentage,
  naturalPercentage,
  proteinPercent = 50,
  carbPercent = 30,
  vegPercent = 20,
}: TransitionCalculatorProps) {
  if (!metaGramasDia) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-center">
          <Scale className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Defina as metas do seu cão para ver as quantidades recomendadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const kibbleGrams = Math.round((metaGramasDia * kibblePercentage) / 100);
  const naturalGrams = Math.round((metaGramasDia * naturalPercentage) / 100);

  // Usar percentuais dinâmicos
  const proteinGrams = Math.round(naturalGrams * (proteinPercent / 100));
  const carbGrams = Math.round(naturalGrams * (carbPercent / 100));
  const vegGrams = Math.round(naturalGrams * (vegPercent / 100));

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          Quantidades de Hoje
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Baseado na meta de {metaGramasDia}g/dia
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total summary */}
        <div className="grid grid-cols-2 gap-3">
          {kibblePercentage > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
              <Utensils className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-600">{kibbleGrams}g</p>
              <p className="text-xs text-muted-foreground">Ração ({kibblePercentage}%)</p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <Leaf className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-600">{naturalGrams}g</p>
            <p className="text-xs text-muted-foreground">Natural ({naturalPercentage}%)</p>
          </div>
        </div>

        {/* Natural food breakdown */}
        {naturalPercentage > 0 && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium mb-2 text-muted-foreground">
              Composição AN ({proteinPercent}/{carbPercent}/{vegPercent}):
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-semibold text-red-500">{proteinGrams}g</p>
                <p className="text-muted-foreground">Proteína</p>
              </div>
              <div>
                <p className="font-semibold text-amber-500">{carbGrams}g</p>
                <p className="text-muted-foreground">Carboidrato</p>
              </div>
              <div>
                <p className="font-semibold text-green-500">{vegGrams}g</p>
                <p className="text-muted-foreground">Vegetal</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          Distribua em 2-3 refeições ao longo do dia
        </p>
      </CardContent>
    </Card>
  );
}
