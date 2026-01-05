import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dog, Loader2, Eye, EyeOff, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type LoginMode = "tutor" | "vet";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>("tutor");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

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
      
      // Check user role after login
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        const userRole = roleData?.role || "tutor";
        
        // Auto-detect and redirect based on role (don't logout on wrong mode)
        if (userRole === "vet") {
          toast({
            title: "Bem-vindo, Doutor(a)! 🩺",
            description: "Login realizado com sucesso.",
          });
          navigate("/vet/dashboard");
          return;
        }

        // Default to tutor
        toast({
          title: "Bem-vindo de volta! 🐕",
          description: "Login realizado com sucesso.",
        });
        navigate("/app/hoje");
        return;

        toast({
          title: mode === "vet" ? "Bem-vindo, Doutor(a)! 🩺" : "Bem-vindo de volta! 🐕",
          description: "Login realizado com sucesso.",
        });
        
        navigate(mode === "vet" ? "/vet/dashboard" : "/app/hoje");
      }
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

  const isTutor = mode === "tutor";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background safe-top overflow-x-hidden">
      {/* Decorative background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isTutor ? "from-primary/5 via-transparent to-accent/5" : "from-blue-500/5 via-transparent to-teal-500/5"} pointer-events-none`} />
      <div className={`absolute top-0 right-0 w-64 h-64 ${isTutor ? "bg-primary/10" : "bg-blue-500/10"} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
      <div className={`absolute bottom-0 left-0 w-64 h-64 ${isTutor ? "bg-accent/10" : "bg-teal-500/10"} rounded-full blur-3xl translate-y-1/2 -translate-x-1/2`} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto keyboard-scroll-container px-6 py-8 relative z-10">
        <div className="w-full max-w-sm mx-auto space-y-8 pt-8 pb-[200px]">
          {/* Logo & Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className={`inline-flex p-4 rounded-2xl shadow-lg ${isTutor ? "bg-gradient-hero shadow-primary/20" : "bg-gradient-to-br from-blue-500 to-teal-500 shadow-blue-500/20"}`}>
              {isTutor ? (
                <Dog className="w-12 h-12 text-primary-foreground" />
              ) : (
                <Stethoscope className="w-12 h-12 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">Cãolorias</h1>
              <p className="text-muted-foreground mt-1">
                {isTutor ? "O diário alimentar do seu cão" : "Portal do Veterinário"}
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setMode("tutor")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isTutor 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Dog className="w-4 h-4" />
              Sou Tutor
            </button>
            <button
              type="button"
              onClick={() => setMode("vet")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                !isTutor 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Sou Veterinário
            </button>
          </div>

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
                disabled={isLoading}
                className={`h-12 text-base rounded-xl bg-card border-border/50 ${isTutor ? "focus:border-primary" : "focus:border-blue-500"}`}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link 
                  to="/recuperar-senha" 
                  className={`text-xs ${isTutor ? "text-primary" : "text-blue-500"} hover:underline font-medium`}
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
                  disabled={isLoading}
                  className={`h-12 text-base rounded-xl bg-card border-border/50 ${isTutor ? "focus:border-primary" : "focus:border-blue-500"} pr-12`}
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
              variant={isTutor ? "hero" : "default"}
              className={`w-full h-14 text-base rounded-xl ${!isTutor ? "bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Create account link */}
          <div className="text-center animate-fade-in animate-stagger-3">
            <p className="text-muted-foreground">
              {isTutor ? "Novo por aqui?" : "Ainda não tem conta?"}{" "}
              <Link 
                to={isTutor ? "/cadastro" : "/cadastro-vet"} 
                className={`${isTutor ? "text-primary" : "text-blue-500"} font-bold hover:underline`}
              >
                {isTutor ? "Criar conta grátis" : "Cadastrar como veterinário"}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
