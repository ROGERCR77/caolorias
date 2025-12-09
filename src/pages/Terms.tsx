import { Link } from "react-router-dom";
import { ArrowLeft, Dog } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
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
        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar ou usar o aplicativo Cãolorias, você concorda em ficar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              O Cãolorias é um aplicativo de organização e acompanhamento da alimentação de cães. 
              Oferecemos ferramentas para registrar refeições, acompanhar peso e receber insights sobre a rotina alimentar do seu pet.
            </p>
            <p className="text-muted-foreground mt-2 font-medium">
              <strong>Importante:</strong> O Cãolorias é uma ferramenta de organização e NÃO substitui a orientação 
              de um médico-veterinário ou nutricionista veterinário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground">
              Para utilizar o Cãolorias, você deve criar uma conta fornecendo informações precisas e atualizadas. 
              Você é responsável por manter a confidencialidade da sua senha e por todas as atividades 
              realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Planos e Assinatura</h2>
            <p className="text-muted-foreground">
              O Cãolorias oferece um plano gratuito com recursos limitados e um plano Premium com recursos completos. 
              Os detalhes de cada plano estão disponíveis na página de assinatura dentro do aplicativo.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Novos usuários recebem 7 dias de teste Premium gratuito</li>
              <li>O plano Premium é cobrado mensalmente via cartão de crédito</li>
              <li>Você pode cancelar a qualquer momento pelo portal do cliente</li>
              <li>Não há reembolso para períodos parciais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Uso Aceitável</h2>
            <p className="text-muted-foreground">Você concorda em não:</p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Usar o serviço para fins ilegais ou não autorizados</li>
              <li>Tentar acessar sistemas ou redes não autorizados</li>
              <li>Compartilhar sua conta com terceiros</li>
              <li>Reproduzir, duplicar ou revender qualquer parte do serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              O Cãolorias e seu conteúdo original, recursos e funcionalidades são de propriedade exclusiva 
              e protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Isenção de Responsabilidade Veterinária</h2>
            <p className="text-muted-foreground">
              O Cãolorias fornece informações gerais sobre alimentação canina apenas para fins educacionais e de organização. 
              Estas informações NÃO constituem aconselhamento veterinário, diagnóstico ou tratamento.
            </p>
            <p className="text-muted-foreground mt-2">
              Sempre consulte um médico-veterinário qualificado para questões relacionadas à saúde, 
              dieta ou condição médica do seu cão.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              Em nenhum caso o Cãolorias, seus diretores, funcionários ou parceiros serão responsáveis 
              por quaisquer danos indiretos, incidentais, especiais ou consequentes decorrentes do uso 
              ou incapacidade de usar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Modificações dos Termos</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento. 
              Se uma revisão for material, forneceremos aviso prévio de pelo menos 30 dias antes 
              de quaisquer novos termos entrarem em vigor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
            <p className="text-muted-foreground">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
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

export default Terms;
