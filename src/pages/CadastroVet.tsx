import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const CadastroVet = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !crmv || !uf) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, e-mail, senha, CRMV e UF.",
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
      const redirectUrl = `${window.location.origin}/`;
      
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name },
        },
      });
      
      if (authError) {
        if (authError.message.includes("User already registered")) {
          throw new Error("Este e-mail já está cadastrado. Tente fazer login.");
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Erro ao criar conta. Tente novamente.");
      }

      // 2. Wait for session to be established (auto-confirm is enabled)
      // This ensures RLS policies can validate the user
      let sessionReady = false;
      for (let i = 0; i < 10; i++) {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user?.id === authData.user.id) {
          sessionReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (!sessionReady) {
        throw new Error("Erro ao estabelecer sessão. Tente fazer login.");
      }

      // 3. Add vet role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: authData.user.id, role: "vet" });

      if (roleError) {
        console.error("Role error:", roleError);
        throw new Error("Erro ao configurar perfil veterinário.");
      }

      // 4. Create vet profile
      const { error: profileError } = await supabase
        .from("vet_profiles")
        .insert({
          user_id: authData.user.id,
          name,
          crmv,
          uf,
          clinic_name: clinicName || null,
          phone: phone || null,
        });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error("Erro ao criar perfil veterinário.");
      }

      toast({
        title: "Conta criada! 🩺",
        description: "Bem-vindo ao Cãolorias Vet!",
      });
      
      navigate("/vet/dashboard");
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

  const benefits = [
    "Gerencie prontuários digitais",
    "Conecte-se com tutores de pacientes",
    "Agende vacinas e retornos",
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background safe-top">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-teal-500/5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto keyboard-scroll-container px-6 py-6 relative z-10">
        <div className="w-full max-w-sm mx-auto space-y-5 pt-4 pb-[200px]">
          {/* Logo & Header */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg shadow-blue-500/20">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Cadastro Veterinário</h1>
              <p className="text-sm text-muted-foreground mt-1">Crie sua conta profissional</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Dr(a). Nome Sobrenome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-11 text-base rounded-xl bg-card border-border/50 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="crmv" className="text-sm font-medium">CRMV</Label>
                <Input
                  id="crmv"
                  type="text"
                  placeholder="12345"
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value)}
                  disabled={isLoading}
                  className="h-11 text-base rounded-xl bg-card border-border/50 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uf" className="text-sm font-medium">UF</Label>
                <Select value={uf} onValueChange={setUf} disabled={isLoading}>
                  <SelectTrigger className="h-11 rounded-xl bg-card border-border/50">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_OPTIONS.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinicName" className="text-sm font-medium">Clínica (opcional)</Label>
              <Input
                id="clinicName"
                type="text"
                placeholder="Nome da clínica ou hospital"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                disabled={isLoading}
                className="h-11 text-base rounded-xl bg-card border-border/50 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className="h-11 text-base rounded-xl bg-card border-border/50 focus:border-blue-500"
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
                disabled={isLoading}
                className="h-11 text-base rounded-xl bg-card border-border/50 focus:border-blue-500"
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
                  disabled={isLoading}
                  className="h-11 text-base rounded-xl bg-card border-border/50 focus:border-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                disabled={isLoading}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                Li e concordo com os{" "}
                <Link to="/termos" className="text-blue-500 hover:underline font-medium" target="_blank">
                  Termos de Uso
                </Link>
                {" "}e a{" "}
                <Link to="/privacidade" className="text-blue-500 hover:underline font-medium" target="_blank">
                  Política de Privacidade
                </Link>
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base rounded-xl mt-2 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white" 
              disabled={isLoading || !acceptedTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta veterinário"
              )}
            </Button>
          </form>

          {/* Benefits */}
          <div className="space-y-2.5 pt-2 animate-fade-in">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit} 
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="p-1 rounded-full bg-blue-500/20 flex-shrink-0">
                  <Check className="w-3 h-3 text-blue-500" />
                </div>
                {benefit}
              </div>
            ))}
          </div>

          {/* Login link */}
          <div className="text-center animate-fade-in">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-blue-500 font-bold hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 py-4 text-center text-xs text-muted-foreground bg-background/80 backdrop-blur-sm safe-bottom">
        <Link to="/" className="hover:text-foreground transition-colors">
          ← Voltar para o site
        </Link>
      </footer>
    </div>
  );
};

export default CadastroVet;
