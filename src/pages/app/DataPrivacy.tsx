import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Share2, Eye, UserCheck, Trash2 } from "lucide-react";

export default function DataPrivacy() {
  const sections = [
    {
      icon: Database,
      title: "Coleta de Dados",
      content: "O aplicativo coleta apenas informações necessárias para seu funcionamento básico e experiência do usuário. Não coletamos dados sensíveis sem consentimento explícito."
    },
    {
      icon: Share2,
      title: "Compartilhamento de Dados",
      content: "As informações do usuário não são vendidas ou compartilhadas com terceiros, exceto quando necessário para operação interna do app ou serviços essenciais (como autenticação, armazenamento ou analytics)."
    },
    {
      icon: Eye,
      title: "Uso Interno",
      content: "Os dados são utilizados apenas para melhorar a experiência do usuário dentro do Cãolorias."
    },
    {
      icon: UserCheck,
      title: "Consentimento e Transparência",
      content: "Sempre que algum dado pessoal for solicitado, o usuário será informado do motivo e poderá aceitar ou recusar."
    },
    {
      icon: Trash2,
      title: "Remoção de Dados",
      content: "O usuário pode solicitar remoção total dos dados pessoais a qualquer momento."
    }
  ];

  return (
    <AppLayout>
      <div className="container max-w-2xl py-6 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Privacidade e Uso de Dados</h1>
        </div>

        <Card className="bg-card border-success/30">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              Nosso Compromisso
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            <p>
              O Cãolorias respeita a privacidade do usuário e segue as diretrizes da App Store.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={index} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-success" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.content}
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
