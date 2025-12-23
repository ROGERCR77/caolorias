import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dog, Heart, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-dog.png";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-background to-accent-light">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 py-12 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-md mb-6 animate-fade-in">
              <Dog className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                O diário alimentar do seu cão
              </span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <span className="text-foreground">Cãolorias</span>
              <span className="block mt-2 text-gradient-hero">
                Organize a alimentação natural do seu cão sem surtar.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              O Cãolorias é o diário alimentar do seu cachorro: registre refeições, acompanhe o peso e veja se a rotina está alinhada com o que o veterinário recomendou.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Button asChild variant="hero" size="xl">
                <Link to="/cadastro">
                  <Heart className="w-5 h-5" />
                  Começar grátis
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/">
                  Já tenho conta
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>100% gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Fácil de usar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Mobile-first</span>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl scale-95" />
              
              <img
                src={heroImage}
                alt="Cão feliz comendo alimentação natural saudável"
                className="relative w-full max-w-lg mx-auto rounded-2xl shadow-xl animate-float"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
