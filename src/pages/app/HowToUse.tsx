import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Navigation, UserCheck, Server, CheckCircle2 } from "lucide-react";

export default function HowToUse() {
  const steps = [
    {
      icon: Navigation,
      title: "Navegação",
      description: "Utilize a barra inferior e os menus internos para acessar cálculo de calorias, histórico, refeição natural, porções e ajustes gerais."
    },
    {
      icon: CheckCircle2,
      title: "Acesso às funcionalidades",
      description: "Todas as telas, botões e recursos essenciais do app estão disponíveis sem necessidade de ações externas."
    },
    {
      icon: UserCheck,
      title: "Conta de Teste",
      description: "Usuário: test@caolorias.com — Senha: Caolorias123"
    },
    {
      icon: Server,
      title: "Dependências externas",
      description: "Nenhum recurso depende de configuração fora do app ou de servidor inacessível. Todos os dados são armazenados de forma segura na nuvem."
    }
  ];

  return (
    <AppLayout>
      <div className="container max-w-2xl py-6 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Como Usar o App</h1>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Bem-vindo ao Cãolorias!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground leading-relaxed">
            <p>
              O Cãolorias foi desenvolvido para ajudar tutores a acompanhar a alimentação e o bem-estar de seus cães.
            </p>
            <p>
              Para garantir o funcionamento correto durante o processo de revisão da Apple, criamos esta explicação detalhada:
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={index} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
