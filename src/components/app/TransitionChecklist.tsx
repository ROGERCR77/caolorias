import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck, Play } from "lucide-react";

interface TransitionChecklistProps {
  onStart: () => void;
}

const checklistItems = [
  {
    id: "protein",
    label: "Tenho proteína leve disponível (frango ou patinho)",
  },
  {
    id: "carb",
    label: "Tenho arroz branco ou batata doce",
  },
  {
    id: "understand",
    label: "Entendo que fezes mais moles são normais nos primeiros dias",
  },
  {
    id: "vet",
    label: "Posso consultar veterinário se houver problemas",
  },
  {
    id: "commit",
    label: "Vou registrar os sintomas diariamente no app",
  },
];

export function TransitionChecklist({ onStart }: TransitionChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const allChecked = checked.size === checklistItems.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          Checklist de Preparação
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Confirme os itens abaixo antes de iniciar
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => toggleItem(item.id)}
            >
              <Checkbox
                id={item.id}
                checked={checked.has(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <label
                htmlFor={item.id}
                className="text-sm leading-tight cursor-pointer"
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>

        <Button
          className="w-full gap-2"
          onClick={onStart}
          disabled={!allChecked}
        >
          <Play className="w-4 h-4" />
          {allChecked ? "Iniciar Transição" : `Confirme ${checklistItems.length - checked.size} itens`}
        </Button>

        {!allChecked && (
          <p className="text-xs text-muted-foreground text-center">
            Marque todos os itens para continuar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
