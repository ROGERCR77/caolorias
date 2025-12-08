import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { BreedReference } from "@/contexts/DataContext";

interface BreedReferenceCardProps {
  breed: BreedReference;
  currentWeight?: number | null;
  dogName?: string;
  variant?: "compact" | "full";
}

export function BreedReferenceCard({ 
  breed, 
  currentWeight, 
  dogName = "o cão",
  variant = "full" 
}: BreedReferenceCardProps) {
  const getWeightStatus = () => {
    if (!currentWeight) return null;
    
    if (currentWeight < breed.peso_min_kg) {
      return {
        status: "abaixo",
        color: "text-amber-600",
        bgColor: "bg-amber-500/10",
        icon: AlertTriangle,
        message: `O peso atual de ${dogName} (${currentWeight} kg) está abaixo da faixa típica para ${breed.breed_name}. Isso não significa automaticamente que ele está magro demais, mas é um sinal para conversar com o veterinário sobre a condição corporal dele.`,
      };
    } else if (currentWeight > breed.peso_max_kg) {
      return {
        status: "acima",
        color: "text-orange-600",
        bgColor: "bg-orange-500/10",
        icon: AlertTriangle,
        message: `O peso atual de ${dogName} (${currentWeight} kg) está acima da faixa típica para ${breed.breed_name}. Muitos cães acima da faixa podem estar com sobrepeso, o que afeta articulações e saúde geral. Vale conversar com um médico-veterinário para avaliar se é o caso de ${dogName}.`,
      };
    } else {
      return {
        status: "dentro",
        color: "text-emerald-600",
        bgColor: "bg-emerald-500/10",
        icon: CheckCircle,
        message: `O peso atual de ${dogName} (${currentWeight} kg) está dentro da faixa típica para ${breed.breed_name}. Ainda assim, a avaliação mais importante é olhar costelas, cintura e musculatura com ajuda de um veterinário.`,
      };
    }
  };

  const weightStatus = getWeightStatus();

  if (variant === "compact") {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
        <Scale className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
        <div>
          <p className="text-muted-foreground">
            Para a raça <span className="font-medium text-foreground">{breed.breed_name}</span>, 
            o peso típico de adultos é de <span className="font-medium text-foreground">{breed.peso_min_kg} a {breed.peso_max_kg} kg</span>.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Isso é apenas uma referência geral. O mais importante é avaliar a condição corporal com um veterinário.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card variant="elevated">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Faixa típica para a raça</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{breed.breed_name}</span>
            <Badge variant="outline">
              {breed.peso_min_kg}–{breed.peso_max_kg} kg
            </Badge>
          </div>

          {weightStatus && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${weightStatus.bgColor}`}>
              <weightStatus.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${weightStatus.color}`} />
              <p className={`text-sm ${weightStatus.color}`}>
                {weightStatus.message}
              </p>
            </div>
          )}

          {!weightStatus && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground">
                Registre o peso atual para ver como ele se compara à faixa típica da raça.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}