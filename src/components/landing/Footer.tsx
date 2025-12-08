import { Dog, Heart, Info } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-8 bg-card border-t">
      <div className="container px-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dog className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Cãolorias</span>
            </div>
            
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Feito com <Heart className="w-4 h-4 text-destructive" /> para tutores e seus cães
            </p>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cãolorias. Todos os direitos reservados.
            </p>
          </div>
          
          {/* Disclaimer */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground text-center">
              O Cãolorias é uma ferramenta de organização. Não substitui a orientação de um médico-veterinário.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
