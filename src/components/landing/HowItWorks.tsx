import { Card, CardContent } from "@/components/ui/card";
import { DogIcon } from "@/components/icons/DogIcon";
import { FoodBowlIcon } from "@/components/icons/FoodBowlIcon";
import { ScaleIcon } from "@/components/icons/ScaleIcon";

const steps = [
  {
    icon: DogIcon,
    title: "Cadastre o seu cão",
    description: "Nome, idade, peso e tipo de alimentação.",
    step: "1",
  },
  {
    icon: FoodBowlIcon,
    title: "Registre o que ele come",
    description: "Refeições, petiscos e quantidades em gramas.",
    step: "2",
  },
  {
    icon: ScaleIcon,
    title: "Acompanhe a evolução",
    description: "Veja o histórico e leve as informações ao veterinário.",
    step: "3",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como funciona
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Em três passos simples, você organiza a alimentação do seu cão
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card 
              key={step.title} 
              variant="feature"
              className="relative overflow-hidden group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Step number background */}
              <div className="absolute -top-4 -right-4 text-8xl font-extrabold text-primary/5 group-hover:text-primary/10 transition-colors">
                {step.step}
              </div>

              <CardContent className="p-6 relative z-10">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-primary-light">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
