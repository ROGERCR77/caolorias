import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex p-3 rounded-full bg-primary-foreground/10 mb-6">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Comece hoje mesmo a organizar a alimentação do seu cão
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            É grátis, simples e pensado especialmente para tutores que alimentam seus cães de forma natural.
          </p>

          <Button asChild variant="accent" size="xl" className="group">
            <Link to="/cadastro">
              Criar minha conta no Cãolorias
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
