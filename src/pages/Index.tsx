import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { WelcomeScreen } from "@/components/app/WelcomeScreen";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/app/hoje", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <>
      <Helmet>
        <title>Cãolorias - O diário alimentar do seu cão</title>
        <meta name="description" content="Registre as refeições, acompanhe o peso e cuide melhor da alimentação natural do seu amigo de quatro patas." />
      </Helmet>
      <WelcomeScreen />
    </>
  );
};

export default Index;
