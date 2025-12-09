import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dog } from "lucide-react";

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Dog className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Cãolorias</h1>
          <p className="text-muted-foreground">
            O diário alimentar do seu cão
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mt-8">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg"
            onClick={() => navigate("/login")}
          >
            Entrar
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full h-14 text-lg"
            onClick={() => navigate("/cadastro")}
          >
            Criar conta
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-8">
          Organize a alimentação natural do seu amigo de quatro patas
        </p>
      </div>
    </div>
  );
};
