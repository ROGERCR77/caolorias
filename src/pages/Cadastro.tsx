import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dog, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/hooks/usePlatform";

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const Cadastro = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signInWithApple } = useAuth();
  const { isIOS } = usePlatform();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: "Termos obrigatórios",
        description: "Você precisa aceitar os termos de uso e política de privacidade.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha precisa ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await signUp(email, password, name);
      toast({
        title: "Conta criada! 🎉",
        description: "Bem-vindo ao Cãolorias! Vamos começar.",
      });
      navigate("/app/hoje");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente em alguns instantes.",
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

  const benefits = [
    "Cadastro rápido e 100% gratuito",
    "Registre refeições e petiscos",
    "Acompanhe o peso do seu cão",
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background safe-top">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

      {/* Main content - scrollable for keyboard */}
      <main className="flex-1 overflow-y-auto keyboard-scroll-container px-6 py-6 relative z-10">
        <div className="w-full max-w-sm mx-auto space-y-6 pt-4 pb-[200px]">
          {/* Logo & Header */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-hero shadow-lg shadow-primary/20">
              <Dog className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Criar conta</h1>
              <p className="text-sm text-muted-foreground mt-1">Comece a organizar a alimentação do seu cão</p>
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
                <span className="bg-background px-3 text-muted-foreground">ou crie com e-mail</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Seu nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Como podemos te chamar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading || isAppleLoading}
                className="h-12 text-base rounded-xl bg-card border-border/50 focus:border-primary"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
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
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isAppleLoading}
                  className="h-12 text-base rounded-xl bg-card border-border/50 focus:border-primary pr-12"
                  autoComplete="new-password"
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

            <div className="flex items-start space-x-3 pt-1">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms} 
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)} 
                disabled={isLoading || isAppleLoading}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                Li e concordo com os{" "}
                <Link to="/termos" className="text-primary hover:underline font-medium" target="_blank">
                  Termos de Uso
                </Link>
                {" "}e a{" "}
                <Link to="/privacidade" className="text-primary hover:underline font-medium" target="_blank">
                  Política de Privacidade
                </Link>
              </label>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full h-14 text-base rounded-xl mt-2" 
              disabled={isLoading || !acceptedTerms || isAppleLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar minha conta grátis"
              )}
            </Button>
          </form>

          {/* Benefits */}
          <div className="space-y-2.5 pt-2 animate-fade-in animate-stagger-2">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit} 
                className={`flex items-center gap-3 text-sm text-muted-foreground animate-fade-in animate-stagger-${index + 2}`}
              >
                <div className="p-1 rounded-full bg-success/20 flex-shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                {benefit}
              </div>
            ))}
          </div>

          {/* Login link */}
          <div className="text-center animate-fade-in">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Entrar
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

export default Cadastro;
