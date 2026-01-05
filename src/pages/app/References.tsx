import { ArrowLeft, ExternalLink, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const references = [
  {
    title: "Organização Mundial da Saúde (OMS)",
    description: "Diretrizes de alimentação e saúde",
    url: "https://www.who.int/health-topics/nutrition"
  },
  {
    title: "National Research Council (NRC)",
    description: "Nutrient Requirements of Dogs and Cats",
    url: "https://nap.nationalacademies.org/catalog/10668"
  },
  {
    title: "American College of Veterinary Nutrition",
    description: "Guidelines gerais de nutrição animal",
    url: "https://www.acvn.org/"
  },
  {
    title: "Dietary Guidelines for Americans",
    description: "Departamento de Saúde dos EUA",
    url: "https://www.dietaryguidelines.gov/"
  }
];

const References = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="page-container flex items-center gap-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Referências Científicas</h1>
        </div>
      </header>

      <main className="page-container page-content">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <h2 className="font-semibold">Fontes das Informações Nutricionais</h2>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            As recomendações e cálculos apresentados no Cãolorias são baseados em diretrizes 
            reconhecidas internacionalmente para nutrição e saúde animal, incluindo:
          </p>

          <div className="space-y-3">
            {references.map((ref, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <a 
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {ref.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {ref.description}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
          <h3 className="font-semibold text-foreground mb-2">Aviso Importante</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            As informações disponibilizadas no Cãolorias têm finalidade educacional e não 
            substituem a orientação de um médico veterinário. Para recomendações específicas 
            sobre a saúde e alimentação do seu pet, consulte um profissional qualificado.
          </p>
        </section>
      </main>
    </div>
  );
};

export default References;
