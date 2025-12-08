import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dog, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-light via-background to-accent-light px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-float">
          <Dog className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Ops! Página não encontrada</h2>
        <p className="text-muted-foreground mb-8">
          Parece que esse caminho não leva a lugar nenhum. Que tal voltar para a página inicial?
        </p>
        
        <Button asChild variant="hero" size="lg">
          <Link to="/">
            <Home className="w-4 h-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
