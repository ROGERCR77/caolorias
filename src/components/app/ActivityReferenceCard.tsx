import { Card, CardContent } from "@/components/ui/card";
import { Activity, Info } from "lucide-react";
import { ActivityReference } from "@/contexts/DataContext";

interface ActivityReferenceCardProps {
  activity: ActivityReference;
  dogName?: string;
  porte: string;
  energia: string;
}

const porteLabels: Record<string, string> = {
  pequeno: "pequeno",
  medio: "médio",
  grande: "grande",
  gigante: "gigante",
};

const energiaLabels: Record<string, string> = {
  baixa: "baixa",
  moderada: "moderada",
  alta: "alta",
};

export function ActivityReferenceCard({ 
  activity, 
  dogName = "seu cão",
  porte,
  energia
}: ActivityReferenceCardProps) {
  return (
    <Card variant="elevated">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Atividade física diária</h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-primary/5">
            <p className="text-3xl font-bold text-primary mb-1">
              {activity.minutos_min_dia}–{activity.minutos_max_dia} min
            </p>
            <p className="text-sm text-muted-foreground">por dia (caminhadas + brincadeiras)</p>
          </div>

          <p className="text-sm text-muted-foreground">
            Para um cão de porte <span className="font-medium text-foreground">{porteLabels[porte]}</span> e 
            nível de energia <span className="font-medium text-foreground">{energiaLabels[energia]}</span>, 
            uma referência geral é de {activity.minutos_min_dia} a {activity.minutos_max_dia} minutos de atividade por dia.
          </p>

          {activity.observacao && (
            <p className="text-sm text-muted-foreground italic">
              {activity.observacao}
            </p>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-sm">
            <Info className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 dark:text-amber-400">
              Esses valores são apenas referências gerais para cães saudáveis. Filhotes, idosos e cães com problemas articulares, respiratórios ou cardíacos precisam de orientação específica de um médico-veterinário antes de aumentar o nível de exercício.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}