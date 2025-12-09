import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dog } from "lucide-react";

export const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)]">
      <div className="flex flex-col items-center gap-10 max-w-sm w-full text-center">
        {/* Logo - App Icon Style */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-[28px] bg-gradient-hero flex items-center justify-center shadow-xl">
            <Dog className="w-14 h-14 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Cãolorias</h1>
            <p className="text-muted-foreground text-base">
              O diário alimentar do seu cão
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 w-full">
          <Button 
            size="lg" 
            variant="hero"
            className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg"
            onClick={() => navigate("/login")}
          >
            Entrar
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full h-14 text-lg font-semibold rounded-2xl border-2"
            onClick={() => navigate("/cadastro")}
          >
            Criar conta
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground">
          Organize a alimentação natural do seu amigo de quatro patas
        </p>
      </div>
    </div>
  );
};
