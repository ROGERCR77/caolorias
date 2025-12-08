import { Check, TrendingUp, Calendar, Shield, HelpCircle, Scale, Cookie, ClipboardList } from "lucide-react";

const painPoints = [
  {
    icon: Calendar,
    text: "Não lembra quanto deu de comida ontem ou na última semana.",
  },
  {
    icon: Scale,
    text: "Fica na dúvida se está pesando certo as marmitinhas.",
  },
  {
    icon: Cookie,
    text: "Tem medo de exagerar nos petiscos.",
  },
  {
    icon: ClipboardList,
    text: "Quer mostrar para o veterinário como está a alimentação, mas não tem os dados organizados.",
  },
];

const benefits = [
  {
    icon: Check,
    title: "Mais clareza na rotina de alimentação natural",
    description: "Saiba exatamente o que seu cão está comendo e em quais quantidades.",
  },
  {
    icon: Calendar,
    title: "Histórico pronto para levar na consulta com o vet",
    description: "Todas as refeições e pesagens registradas e fáceis de consultar.",
  },
  {
    icon: TrendingUp,
    title: "Enxergue se o cão está comendo mais ou menos que o planejado",
    description: "Acompanhe a evolução do peso e mantenha seu cão saudável.",
  },
  {
    icon: Shield,
    title: "Apoio para seguir o plano do veterinário",
    description: "Use o Cãolorias para registrar e acompanhar o que foi prescrito.",
  },
];

export const Benefits = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        {/* Pain points section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 mb-4">
              <HelpCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Você se identifica?</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Dores que o <span className="text-primary">Cãolorias</span> resolve
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {painPoints.map((pain, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border"
              >
                <pain.icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{pain.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que usar o <span className="text-primary">Cãolorias</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cuide melhor da saúde do seu cão com organização e praticidade
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.title}
              className="group p-6 rounded-xl bg-card border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4 inline-flex p-3 rounded-lg bg-accent-light group-hover:bg-accent/20 transition-colors">
                <benefit.icon className="w-6 h-6 text-accent-dark" />
              </div>
              <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
