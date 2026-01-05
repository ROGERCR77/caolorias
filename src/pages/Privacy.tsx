import { Link } from "react-router-dom";
import { ArrowLeft, Dog } from "lucide-react";

const Privacy = () => {
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
        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
            <p className="text-muted-foreground">
              O Cãolorias respeita sua privacidade e está comprometido em proteger seus dados pessoais. 
              Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações 
              quando você usa nosso aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Dados que Coletamos</h2>
            <p className="text-muted-foreground">Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li><strong>Dados de conta:</strong> Nome, e-mail e senha criptografada</li>
              <li><strong>Dados dos cães:</strong> Nome, raça, peso, data de nascimento, foto</li>
              <li><strong>Dados de alimentação:</strong> Refeições registradas, alimentos, quantidades</li>
              <li><strong>Dados de saúde animal:</strong> Histórico de peso, registros de fezes, níveis de energia, atividades físicas, sintomas de saúde</li>
              <li><strong>Dados de uso:</strong> Interações com o aplicativo, preferências</li>
              <li><strong>Identificadores de dispositivo:</strong> Para envio de notificações push</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2.1. Fotos e Acesso à Câmera</h2>
            <p className="text-muted-foreground">
              O Cãolorias solicita acesso à sua câmera e biblioteca de fotos para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Adicionar fotos do seu cão ao perfil</li>
              <li>Registrar fotos de saúde (fezes, sintomas, carteira de vacinação)</li>
              <li>Documentar registros para consultas veterinárias</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>Informações importantes sobre suas fotos:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>As fotos são armazenadas de forma segura em nossos servidores</li>
              <li>Você pode remover fotos a qualquer momento</li>
              <li>As fotos são usadas exclusivamente dentro do aplicativo</li>
              <li>Não compartilhamos suas fotos com terceiros sem seu consentimento</li>
              <li>Ao excluir sua conta, todas as fotos são permanentemente removidas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2.2. Notificações Push</h2>
            <p className="text-muted-foreground">
              O Cãolorias utiliza o serviço OneSignal para enviar notificações push. Ao aceitar receber notificações, coletamos:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li><strong>Identificador do dispositivo (Device ID):</strong> Um identificador único do seu dispositivo para direcionamento de notificações</li>
              <li><strong>Token de push:</strong> Fornecido pela Apple (APNs) ou Google (FCM) para entrega de notificações</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>Tipos de notificações que enviamos:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Lembretes de refeições e medicamentos</li>
              <li>Alertas de saúde e acompanhamento</li>
              <li>Comunicações de veterinários vinculados</li>
              <li>Lembretes de vacinas e consultas</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Você pode desativar as notificações a qualquer momento nas configurações do seu dispositivo ou dentro do aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2.3. Dados de Saúde Animal</h2>
            <p className="text-muted-foreground">
              O Cãolorias coleta dados relacionados à saúde do seu cão para fornecer insights e acompanhamento. Estes dados incluem:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li><strong>Registros de peso:</strong> Histórico de pesagens para acompanhamento da evolução</li>
              <li><strong>Registros de fezes:</strong> Textura, cor, presença de muco ou sangue para monitoramento digestivo</li>
              <li><strong>Níveis de energia:</strong> Observações diárias sobre o comportamento do cão</li>
              <li><strong>Atividades físicas:</strong> Tipo, duração e intensidade de exercícios</li>
              <li><strong>Sintomas de saúde:</strong> Registro de sintomas para acompanhamento veterinário</li>
              <li><strong>Carteira de vacinação:</strong> Histórico de vacinas, vermífugos e medicamentos</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>Importante:</strong> Estes são dados de saúde animal (não humana) e são usados exclusivamente para melhorar o cuidado do seu pet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Como Usamos seus Dados</h2>
            <p className="text-muted-foreground">Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Fornecer e manter o serviço</li>
              <li>Personalizar sua experiência no aplicativo</li>
              <li>Gerar insights sobre a alimentação e saúde do seu cão</li>
              <li>Enviar notificações e lembretes (quando autorizados)</li>
              <li>Facilitar o acompanhamento veterinário (quando você vincular um profissional)</li>
              <li>Melhorar nossos serviços e desenvolver novos recursos</li>
              <li>Processar pagamentos de assinaturas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Armazenamento e Segurança</h2>
            <p className="text-muted-foreground">
              Seus dados são armazenados em servidores seguros com criptografia. 
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações 
              contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
            <p className="text-muted-foreground mt-3">
              <strong>Serviços de infraestrutura:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li><strong>Supabase:</strong> Armazenamento seguro de dados e autenticação</li>
              <li><strong>OneSignal:</strong> Gerenciamento de notificações push</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              <strong>Não vendemos seus dados pessoais.</strong> Podemos compartilhar informações apenas:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Com provedores de serviços essenciais (processamento de pagamentos, infraestrutura)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5.1. Compartilhamento com Veterinários</h2>
            <p className="text-muted-foreground">
              O Cãolorias permite que você vincule um médico-veterinário para acompanhamento remoto do seu cão. 
              <strong> Este compartilhamento só ocorre mediante seu consentimento explícito.</strong>
            </p>
            <p className="text-muted-foreground mt-3">
              <strong>Quando você vincula um veterinário, ele terá acesso a:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Dados do perfil do seu cão (nome, raça, peso, idade)</li>
              <li>Histórico de peso e evolução</li>
              <li>Registros de saúde (fezes, energia, sintomas)</li>
              <li>Registros de atividades físicas</li>
              <li>Carteira de vacinação</li>
              <li>Relatórios de saúde que você gerar</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>Seus direitos sobre este compartilhamento:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Você pode revogar o acesso do veterinário a qualquer momento</li>
              <li>Ao desvincular, o veterinário perde acesso imediato aos seus dados</li>
              <li>Você controla quais cães compartilha com cada veterinário</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5.2. Serviços de Terceiros</h2>
            <p className="text-muted-foreground">
              O Cãolorias utiliza os seguintes serviços de terceiros para seu funcionamento:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li><strong>Supabase:</strong> Armazenamento de dados, autenticação e funções serverless</li>
              <li><strong>OneSignal:</strong> Envio de notificações push</li>
              <li><strong>Apple App Store / Google Play:</strong> Processamento de compras in-app</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Cada serviço possui sua própria política de privacidade e está em conformidade com as regulamentações aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir sua conta, 
              removeremos seus dados pessoais em até 30 dias, exceto quando a retenção for necessária 
              para cumprir obrigações legais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6.1. Exclusão de Conta e Dados Veterinários</h2>
            <p className="text-muted-foreground">
              Ao solicitar a exclusão da sua conta:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Todos os seus dados pessoais serão removidos permanentemente</li>
              <li>Todos os dados dos seus cães serão excluídos</li>
              <li>Relatórios compartilhados com veterinários serão removidos</li>
              <li>Vínculos com veterinários serão automaticamente desfeitos</li>
              <li>Fotos armazenadas serão deletadas dos nossos servidores</li>
              <li>Histórico de notificações será removido</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong>A exclusão é irreversível.</strong> Recomendamos exportar seus dados antes de excluir a conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies e tecnologias similares para manter você conectado e melhorar sua experiência. 
              Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Rastreamento e Publicidade</h2>
            <p className="text-muted-foreground">
              <strong>O Cãolorias NÃO:</strong>
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Rastreia você para fins publicitários</li>
              <li>Vende seus dados a anunciantes ou terceiros</li>
              <li>Utiliza SDKs de publicidade ou redes de anúncios</li>
              <li>Compartilha identificadores para rastreamento entre aplicativos</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              O aplicativo é sustentado por assinaturas Premium, não por publicidade. 
              Respeitamos sua privacidade e não participamos de práticas de rastreamento publicitário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre 
              mudanças significativas por e-mail ou através de um aviso no aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contato e Encarregado de Dados (DPO)</h2>
            <p className="text-muted-foreground">
              Para questões sobre privacidade, exercer seus direitos ou entrar em contato com nosso Encarregado de Proteção de Dados:
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>E-mail:</strong> privacidade@caolorias.com.br
            </p>
            <p className="text-muted-foreground mt-1">
              <strong>Encarregado de Dados (DPO):</strong> dpo@caolorias.com.br
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
