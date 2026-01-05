import { Link } from "react-router-dom";
import { ArrowLeft, Dog, CreditCard, Shield, Heart } from "lucide-react";

const Advertising = () => {
  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
        <div className="container px-4">
          <div className="flex items-center justify-between h-14">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary">
                <Dog className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Cãolorias</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Política de Monetização</h1>
        <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          
          {/* Destaque principal */}
          <div className="bg-success/10 border border-success/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-success" />
              <h2 className="text-xl font-semibold m-0">Sem Anúncios, Sem Rastreamento</h2>
            </div>
            <p className="text-muted-foreground m-0">
              O Cãolorias <strong>não exibe anúncios</strong> e <strong>não rastreia seus dados para fins publicitários</strong>. 
              Acreditamos que sua privacidade e a experiência de uso são mais importantes do que receita publicitária.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              1. Como o Cãolorias é Sustentado
            </h2>
            <p className="text-muted-foreground">
              O Cãolorias é sustentado exclusivamente por <strong>assinaturas Premium</strong>. 
              Este modelo nos permite:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Manter o aplicativo livre de anúncios para todos os usuários</li>
              <li>Não vender ou compartilhar seus dados com anunciantes</li>
              <li>Focar 100% na experiência do usuário e funcionalidades úteis</li>
              <li>Investir em melhorias contínuas e novos recursos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Planos Disponíveis</h2>
            <p className="text-muted-foreground">
              Oferecemos duas opções para você:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-2">
              <li>
                <strong>Plano Gratuito:</strong> Acesso a recursos básicos de organização alimentar, 
                sem anúncios, com limitações em funcionalidades avançadas.
              </li>
              <li>
                <strong>Plano Premium:</strong> Acesso completo a todos os recursos, incluindo 
                insights de IA, histórico ilimitado, múltiplos cães, exportação de relatórios, 
                e todas as funcionalidades de saúde.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Transparência Total</h2>
            <p className="text-muted-foreground">
              Queremos ser completamente transparentes sobre como ganhamos dinheiro:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li><strong>100%</strong> da nossa receita vem de assinaturas Premium</li>
              <li><strong>0%</strong> vem de publicidade ou venda de dados</li>
              <li>Não temos parcerias pagas com fabricantes de ração ou petshops</li>
              <li>Recomendações no app são baseadas em informação, não em patrocínio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-destructive" />
              4. Por Que Escolhemos Este Modelo
            </h2>
            <p className="text-muted-foreground">
              Muitos aplicativos gratuitos são sustentados por anúncios invasivos e venda de dados. 
              Acreditamos que isso prejudica a experiência do usuário e levanta preocupações de privacidade.
            </p>
            <p className="text-muted-foreground mt-3">
              Ao optar por um modelo de assinatura, podemos:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Priorizar suas necessidades acima de anunciantes</li>
              <li>Manter uma experiência limpa e sem interrupções</li>
              <li>Garantir que seus dados de saúde animal permaneçam privados</li>
              <li>Desenvolver recursos que realmente ajudam você e seu cão</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Compromisso Futuro</h2>
            <p className="text-muted-foreground">
              Nos comprometemos a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Nunca introduzir anúncios no aplicativo</li>
              <li>Nunca vender seus dados para terceiros</li>
              <li>Manter o plano gratuito sempre disponível</li>
              <li>Comunicar claramente qualquer mudança em nossa política de monetização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contato</h2>
            <p className="text-muted-foreground">
              Se você tiver dúvidas sobre nossa política de monetização ou sugestões:
            </p>
            <p className="text-muted-foreground mt-2">
              E-mail: contato@caolorias.com.br
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Advertising;
