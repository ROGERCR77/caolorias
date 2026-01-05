import { Link } from "react-router-dom";
import { ArrowLeft, Dog } from "lucide-react";

const Terms = () => {
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
              O Cãolorias é um aplicativo de organização e acompanhamento da alimentação e saúde de cães. 
              Oferecemos ferramentas para registrar refeições, acompanhar peso, monitorar saúde digestiva, 
              registrar atividades físicas e receber insights sobre a rotina do seu pet.
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
              <li>O plano Premium é cobrado mensalmente ou anualmente via Apple App Store ou Google Play</li>
              <li>Você pode cancelar a qualquer momento pelas configurações da sua loja de aplicativos</li>
              <li>Cancelamentos seguem as políticas de reembolso da Apple/Google</li>
              <li>A assinatura renova automaticamente a menos que você a cancele</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4.1. Restauração de Compras</h2>
            <p className="text-muted-foreground">
              Se você reinstalar o aplicativo ou trocar de dispositivo, pode restaurar suas compras anteriores 
              através do botão "Restaurar Compras" na página de assinatura. A restauração está vinculada 
              à sua conta Apple ID ou Google Play.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Uso Aceitável</h2>
            <p className="text-muted-foreground">Você concorda em não:</p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Usar o serviço para fins ilegais ou não autorizados</li>
              <li>Tentar acessar sistemas ou redes não autorizados</li>
              <li>Compartilhar sua conta com terceiros</li>
              <li>Reproduzir, duplicar ou revender qualquer parte do serviço</li>
              <li>Enviar conteúdo ofensivo, difamatório ou que viole direitos de terceiros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Vínculo com Veterinários</h2>
            <p className="text-muted-foreground">
              O Cãolorias permite que tutores vinculem médicos-veterinários para acompanhamento remoto dos seus cães. 
              Ao vincular um veterinário:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Você consente em compartilhar os dados de saúde do seu cão com o profissional</li>
              <li>O veterinário terá acesso ao histórico de saúde, peso, alimentação e registros do animal</li>
              <li>Você pode revogar este acesso a qualquer momento</li>
              <li>O vínculo é estabelecido através de um código único fornecido pelo veterinário</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6.1. Responsabilidades do Veterinário</h2>
            <p className="text-muted-foreground">
              Veterinários que utilizam o Cãolorias concordam em:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Manter sigilo profissional sobre os dados dos pacientes</li>
              <li>Utilizar os dados exclusivamente para fins de acompanhamento veterinário</li>
              <li>Não compartilhar os dados com terceiros sem autorização do tutor</li>
              <li>Manter seu registro profissional (CRMV) atualizado e válido</li>
              <li>Seguir as normas éticas da medicina veterinária</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6.2. Consentimento para Compartilhamento</h2>
            <p className="text-muted-foreground">
              Ao vincular um veterinário ao perfil do seu cão, você consente expressamente que:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>O profissional visualize todos os dados de saúde registrados no aplicativo</li>
              <li>O veterinário possa adicionar anotações e recomendações</li>
              <li>Relatórios de saúde gerados por você sejam acessíveis ao profissional</li>
              <li>O veterinário possa agendar lembretes e consultas</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Este consentimento pode ser revogado a qualquer momento desvinculando o profissional 
              através das configurações do aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              O Cãolorias e seu conteúdo original, recursos e funcionalidades são de propriedade exclusiva 
              e protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Isenção de Responsabilidade Veterinária</h2>
            <p className="text-muted-foreground">
              O Cãolorias fornece informações gerais sobre alimentação e saúde canina apenas para fins educacionais e de organização. 
              Estas informações NÃO constituem aconselhamento veterinário, diagnóstico ou tratamento.
            </p>
            <p className="text-muted-foreground mt-2">
              Sempre consulte um médico-veterinário qualificado para questões relacionadas à saúde, 
              dieta ou condição médica do seu cão. Em caso de emergência, procure atendimento veterinário imediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              Em nenhum caso o Cãolorias, seus diretores, funcionários ou parceiros serão responsáveis 
              por quaisquer danos indiretos, incidentais, especiais ou consequentes decorrentes do uso 
              ou incapacidade de usar o serviço.
            </p>
            <p className="text-muted-foreground mt-2">
              O Cãolorias não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Decisões tomadas com base em informações do aplicativo sem orientação veterinária</li>
              <li>Atrasos ou falhas no envio de notificações</li>
              <li>Perda de dados devido a falhas técnicas</li>
              <li>Ações ou omissões de veterinários vinculados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Exclusão de Conta</h2>
            <p className="text-muted-foreground">
              Você pode solicitar a exclusão da sua conta a qualquer momento através das configurações do aplicativo. 
              Ao excluir sua conta:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Todos os seus dados pessoais serão permanentemente removidos</li>
              <li>Vínculos com veterinários serão automaticamente desfeitos</li>
              <li>Assinaturas ativas devem ser canceladas separadamente na loja de aplicativos</li>
              <li>Esta ação é irreversível</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Modificações dos Termos</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento. 
              Se uma revisão for material, forneceremos aviso prévio de pelo menos 30 dias antes 
              de quaisquer novos termos entrarem em vigor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Lei Aplicável</h2>
            <p className="text-muted-foreground">
              Estes termos são regidos pelas leis da República Federativa do Brasil. 
              Qualquer disputa será resolvida nos tribunais competentes da cidade de São Paulo, SP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contato</h2>
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
