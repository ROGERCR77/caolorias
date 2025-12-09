import { Link } from "react-router-dom";
import { ArrowLeft, Dog } from "lucide-react";

const Privacy = () => {
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
              <li><strong>Dados de progresso:</strong> Histórico de peso, metas alimentares</li>
              <li><strong>Dados de uso:</strong> Interações com o aplicativo, preferências</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Como Usamos seus Dados</h2>
            <p className="text-muted-foreground">Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Fornecer e manter o serviço</li>
              <li>Personalizar sua experiência no aplicativo</li>
              <li>Gerar insights sobre a alimentação do seu cão</li>
              <li>Enviar notificações e lembretes (quando autorizados)</li>
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
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              <strong>Não vendemos seus dados pessoais.</strong> Podemos compartilhar informações apenas:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Com provedores de serviços essenciais (processamento de pagamentos)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos legais</li>
            </ul>
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
            <h2 className="text-xl font-semibold mb-3">9. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre 
              mudanças significativas por e-mail ou através de um aviso no aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato:
            </p>
            <p className="text-muted-foreground mt-2">
              E-mail: privacidade@caolorias.com.br
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
