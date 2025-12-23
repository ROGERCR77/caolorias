import { AppLayout } from "@/components/app/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Share2, Eye, UserCheck, Trash2, Camera, Bell, Heart, Stethoscope, Ban } from "lucide-react";

export default function DataPrivacy() {
  const sections = [
    {
      icon: Database,
      title: "Coleta de Dados",
      content: "O aplicativo coleta apenas informações necessárias para seu funcionamento: dados da conta, informações dos seus cães, registros de alimentação e saúde, e identificadores para notificações."
    },
    {
      icon: Camera,
      title: "Fotos e Câmera",
      content: "Solicitamos acesso à câmera e fotos para adicionar imagens do seu cão e registrar fotos de saúde. As fotos são armazenadas com segurança, usadas exclusivamente no app e removidas ao excluir sua conta."
    },
    {
      icon: Heart,
      title: "Dados de Saúde Animal",
      content: "Coletamos registros de peso, fezes, energia, atividades e sintomas para ajudar no acompanhamento da saúde do seu cão. Estes são dados de saúde animal (não humana) e podem ser compartilhados com veterinários vinculados."
    },
    {
      icon: Bell,
      title: "Notificações Push",
      content: "Usamos OneSignal para enviar lembretes de refeições, alertas de saúde e comunicações veterinárias. Coletamos um identificador do dispositivo para direcionar as notificações. Você pode desativá-las a qualquer momento."
    },
    {
      icon: Stethoscope,
      title: "Compartilhamento com Veterinários",
      content: "Quando você vincula um veterinário, ele terá acesso aos dados de saúde do seu cão para acompanhamento remoto. Este compartilhamento ocorre apenas com seu consentimento e pode ser revogado a qualquer momento."
    },
    {
      icon: Share2,
      title: "Compartilhamento de Dados",
      content: "Seus dados NÃO são vendidos ou compartilhados com terceiros para fins publicitários. Utilizamos apenas serviços essenciais (Supabase para armazenamento, OneSignal para notificações)."
    },
    {
      icon: Ban,
      title: "Sem Rastreamento Publicitário",
      content: "O Cãolorias não exibe anúncios e não rastreia você para fins publicitários. Somos sustentados por assinaturas Premium, não por venda de dados."
    },
    {
      icon: Eye,
      title: "Uso Interno",
      content: "Os dados são utilizados apenas para melhorar sua experiência dentro do Cãolorias, gerar insights de saúde e facilitar o acompanhamento veterinário quando autorizado."
    },
    {
      icon: UserCheck,
      title: "Consentimento e Transparência",
      content: "Sempre que algum dado pessoal for solicitado, você será informado do motivo e poderá aceitar ou recusar. Seguimos as diretrizes da LGPD brasileira."
    },
    {
      icon: Trash2,
      title: "Remoção de Dados",
      content: "Você pode solicitar exclusão total dos dados pessoais a qualquer momento através das configurações. Isso inclui todos os dados dos cães, relatórios compartilhados e vínculos com veterinários."
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
          <p className="text-sm text-muted-foreground">
            Entenda como seus dados são coletados, usados e protegidos
          </p>
        </div>

        <Card className="bg-card border-success/30">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              Nosso Compromisso
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed space-y-2">
            <p>
              O Cãolorias respeita sua privacidade e segue as diretrizes da App Store, Google Play e LGPD.
            </p>
            <p className="font-medium text-foreground">
              Não vendemos seus dados e não exibimos anúncios.
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

        <Card className="bg-card border-primary/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Para detalhes completos, consulte nossa{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Política de Privacidade
              </a>{" "}
              e{" "}
              <a href="/terms" className="text-primary hover:underline">
                Termos de Uso
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
