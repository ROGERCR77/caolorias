import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dog, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/hooks/usePlatform";

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithApple } = useAuth();
  const { isIOS } = usePlatform();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await signIn(email, password);
      toast({
        title: "Bem-vindo de volta! 🐕",
        description: "Login realizado com sucesso.",
      });
      navigate("/app/hoje");
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      toast({
        title: "Erro ao entrar com Apple",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      setIsAppleLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background safe-top">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Main content - scrollable for keyboard */}
      <main className="flex-1 overflow-y-auto keyboard-scroll-container px-6 py-8 relative z-10">
        <div className="w-full max-w-sm mx-auto space-y-8 pt-8 pb-[200px]">
          {/* Logo & Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-hero shadow-lg shadow-primary/20">
              <Dog className="w-12 h-12 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">Cãolorias</h1>
              <p className="text-muted-foreground mt-1">O diário alimentar do seu cão</p>
            </div>
          </div>

          {/* Apple Sign-In Button - Only on iOS */}
          {isIOS && (
            <div className="animate-slide-up">
              <Button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isAppleLoading || isLoading}
                className="w-full h-14 text-base rounded-xl bg-foreground text-background hover:bg-foreground/90"
              >
                {isAppleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <AppleIcon />
                    <span className="ml-2">Continuar com Apple</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Divider - Only show if Apple button is visible */}
          {isIOS && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">ou use e-mail</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isAppleLoading}
                className="h-12 text-base rounded-xl bg-card border-border/50 focus:border-primary"
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link 
                  to="/recuperar-senha" 
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isAppleLoading}
                  className="h-12 text-base rounded-xl bg-card border-border/50 focus:border-primary pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-target-sm flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full h-14 text-base rounded-xl" 
              disabled={isLoading || isAppleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar com e-mail"
              )}
            </Button>
          </form>

          {/* Create account link */}
          <div className="text-center animate-fade-in animate-stagger-3">
            <p className="text-muted-foreground">
              Novo por aqui?{" "}
              <Link to="/cadastro" className="text-primary font-bold hover:underline">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer - fixed at bottom */}
      <footer className="sticky bottom-0 py-4 text-center text-xs text-muted-foreground bg-background/80 backdrop-blur-sm safe-bottom">
        <Link to="/" className="hover:text-foreground transition-colors">
          ← Voltar para o site
        </Link>
      </footer>
    </div>
  );
};

export default Login;
