import { Link } from "react-router-dom";
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
            
            <div className="flex items-center gap-4 text-sm">
              <Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <Link to="/publicidade" className="text-muted-foreground hover:text-foreground transition-colors">
                Publicidade
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cãolorias
            </p>
          </div>
          
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
