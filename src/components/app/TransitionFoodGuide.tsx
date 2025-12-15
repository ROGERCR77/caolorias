import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beef, Wheat, Salad, AlertTriangle, Check } from "lucide-react";

interface TransitionFoodGuideProps {
  currentDay: number;
}

const phases = [
  {
    days: [1, 2, 3, 4],
    name: "Fase 1: Introdução Suave",
    description: "Primeiros passos com proteínas leves",
    proteins: [
      { name: "Frango cozido (sem osso)", ideal: true },
      { name: "Patinho moído cozido", ideal: true },
      { name: "Peito de peru cozido", ideal: false },
    ],
    carbs: [
      { name: "Arroz branco bem cozido", ideal: true },
      { name: "Batata doce cozida", ideal: true },
    ],
    vegetables: [
      { name: "Cenoura cozida (amassada)", ideal: true },
      { name: "Abobrinha cozida", ideal: true },
    ],
    avoid: ["Carnes vermelhas gordurosas", "Vegetais crus", "Vísceras", "Ovos"],
    tip: "Proteínas brancas são mais fáceis de digerir. Cozinhe bem todos os alimentos.",
  },
  {
    days: [5, 6, 7, 8, 9],
    name: "Fase 2: Diversificação",
    description: "Expandindo o cardápio gradualmente",
    proteins: [
      { name: "Frango cozido", ideal: true },
      { name: "Patinho/Músculo cozido", ideal: true },
      { name: "Fígado bovino (pequena qtd)", ideal: false },
    ],
    carbs: [
      { name: "Arroz branco ou integral", ideal: true },
      { name: "Batata doce", ideal: true },
      { name: "Batata inglesa cozida", ideal: false },
    ],
    vegetables: [
      { name: "Cenoura cozida", ideal: true },
      { name: "Abobrinha cozida", ideal: true },
      { name: "Chuchu cozido", ideal: false },
      { name: "Brócolis cozido (pouco)", ideal: false },
    ],
    avoid: ["Vegetais crus", "Ovos inteiros", "Frutas em excesso"],
    tip: "Introduza uma novidade por vez para identificar possíveis intolerâncias.",
  },
  {
    days: [10, 11, 12, 13, 14],
    name: "Fase 3: Consolidação",
    description: "Variedade completa de alimentos naturais",
    proteins: [
      { name: "Variedade de carnes magras", ideal: true },
      { name: "Vísceras (até 5% da refeição)", ideal: true },
      { name: "Ovo cozido (2-3x semana)", ideal: true },
      { name: "Peixe cozido (sem espinha)", ideal: false },
    ],
    carbs: [
      { name: "Arroz (branco ou integral)", ideal: true },
      { name: "Batata doce", ideal: true },
      { name: "Abóbora cozida", ideal: false },
    ],
    vegetables: [
      { name: "Variedade de vegetais cozidos", ideal: true },
      { name: "Folhas escuras (pouco)", ideal: false },
    ],
    avoid: ["Cebola", "Alho em excesso", "Uvas/passas", "Chocolate", "Abacate"],
    tip: "Agora você pode variar mais! Mantenha a proporção entre proteína, carbo e vegetais.",
  },
];

export function TransitionFoodGuide({ currentDay }: TransitionFoodGuideProps) {
  const currentPhase = phases.find((p) => p.days.includes(currentDay)) || phases[0];
  const phaseIndex = phases.indexOf(currentPhase);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Guia de Alimentos</CardTitle>
          <Badge variant="outline">Fase {phaseIndex + 1}/3</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{currentPhase.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Proteins */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Beef className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Proteínas</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentPhase.proteins.map((item) => (
              <Badge
                key={item.name}
                variant={item.ideal ? "default" : "secondary"}
                className="text-xs"
              >
                {item.ideal && <Check className="w-3 h-3 mr-1" />}
                {item.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Carbs */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wheat className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Carboidratos</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentPhase.carbs.map((item) => (
              <Badge
                key={item.name}
                variant={item.ideal ? "default" : "secondary"}
                className="text-xs"
              >
                {item.ideal && <Check className="w-3 h-3 mr-1" />}
                {item.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Vegetables */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Salad className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Vegetais</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {currentPhase.vegetables.map((item) => (
              <Badge
                key={item.name}
                variant={item.ideal ? "default" : "secondary"}
                className="text-xs"
              >
                {item.ideal && <Check className="w-3 h-3 mr-1" />}
                {item.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Avoid */}
        <div className="p-3 rounded-lg bg-destructive/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Evite nesta fase</span>
          </div>
          <p className="text-xs text-muted-foreground">{currentPhase.avoid.join(" • ")}</p>
        </div>

        {/* Tip */}
        <p className="text-xs text-muted-foreground italic">💡 {currentPhase.tip}</p>
      </CardContent>
    </Card>
  );
}
