import { Link } from "react-router-dom";
import { ArrowLeft, Dog } from "lucide-react";

const Advertising = () => {
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
        <h1 className="text-3xl font-bold mb-2">Termos de Publicidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Sobre Publicidade no Cãolorias</h2>
            <p className="text-muted-foreground">
              O Cãolorias pode exibir anúncios para usuários do plano gratuito como forma de manter 
              o serviço disponível sem custo. Esta página explica como a publicidade funciona em nosso aplicativo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Tipos de Anúncios</h2>
            <p className="text-muted-foreground">Podemos exibir os seguintes tipos de publicidade:</p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li><strong>Banners:</strong> Anúncios gráficos em áreas designadas do aplicativo</li>
              <li><strong>Conteúdo patrocinado:</strong> Artigos e dicas de parceiros do segmento pet</li>
              <li><strong>Recomendações de produtos:</strong> Sugestões de produtos relacionados à alimentação canina</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Parceiros de Publicidade</h2>
            <p className="text-muted-foreground">
              Trabalhamos apenas com parceiros que compartilham nossos valores de cuidado e bem-estar animal. 
              Nossos parceiros podem incluir:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Fabricantes de alimentos naturais para cães</li>
              <li>Pet shops e lojas especializadas</li>
              <li>Serviços veterinários e de saúde animal</li>
              <li>Produtos e acessórios para pets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Personalização de Anúncios</h2>
            <p className="text-muted-foreground">
              Para tornar os anúncios mais relevantes, podemos usar informações como o porte do seu cão 
              ou tipo de alimentação preferida. <strong>Nunca compartilhamos seus dados pessoais 
              diretamente com anunciantes.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Como Remover Anúncios</h2>
            <p className="text-muted-foreground">
              Usuários do <strong>plano Premium</strong> desfrutam de uma experiência livre de anúncios. 
              Ao assinar o Premium, você remove todos os anúncios do aplicativo e obtém acesso a 
              recursos exclusivos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Diretrizes de Conteúdo Publicitário</h2>
            <p className="text-muted-foreground">Todos os anúncios no Cãolorias devem:</p>
            <ul className="list-disc pl-6 text-muted-foreground mt-2 space-y-1">
              <li>Ser relevantes para tutores de cães</li>
              <li>Não conter informações falsas ou enganosas</li>
              <li>Respeitar o bem-estar animal</li>
              <li>Não promover produtos ou práticas prejudiciais à saúde canina</li>
              <li>Seguir as regulamentações de publicidade brasileiras</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Divulgação de Publicidade</h2>
            <p className="text-muted-foreground">
              Todo conteúdo patrocinado é claramente identificado com etiquetas como "Patrocinado", 
              "Anúncio" ou "Parceiro", para que você possa distinguir facilmente entre conteúdo 
              editorial e publicitário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Para Anunciantes</h2>
            <p className="text-muted-foreground">
              Se você representa uma empresa do segmento pet e tem interesse em anunciar no Cãolorias, 
              entre em contato conosco para conhecer nossas opções de parceria.
            </p>
            <p className="text-muted-foreground mt-2">
              E-mail: publicidade@caolorias.com.br
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Feedback sobre Anúncios</h2>
            <p className="text-muted-foreground">
              Se você encontrar um anúncio inapropriado ou tiver sugestões sobre nossa publicidade, 
              por favor nos avise. Valorizamos seu feedback para manter a qualidade do nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
            <p className="text-muted-foreground">
              Para questões sobre publicidade no Cãolorias:
            </p>
            <p className="text-muted-foreground mt-2">
              E-mail: publicidade@caolorias.com.br
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Advertising;
