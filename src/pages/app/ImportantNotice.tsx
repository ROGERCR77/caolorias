import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ImportantNotice() {
  return (
    <AppLayout>
      <div className="container max-w-2xl py-6 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Aviso Importante</h1>
        </div>

        <Card className="border-warning/30 bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Informações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              As informações apresentadas no Cãolorias têm caráter <strong className="text-foreground">exclusivamente informativo e educacional</strong>.
              Elas não substituem a avaliação, diagnóstico ou acompanhamento de um médico-veterinário.
            </p>

            <p>
              As sugestões de alimentação, calorias ou cuidados oferecidas pelo app são apenas <strong className="text-foreground">estimativas gerais</strong> e não configuram orientação profissional.
            </p>

            <p>
              Antes de alterar a dieta, rotina ou cuidados de saúde do seu animal, <strong className="text-foreground">consulte sempre um médico-veterinário qualificado</strong>.
            </p>

            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 mt-6">
              <p className="text-sm text-foreground font-medium">
                O uso das informações fornecidas é de responsabilidade do usuário.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
