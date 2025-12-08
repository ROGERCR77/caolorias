import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dog, ArrowLeft, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Cadastro = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-light via-background to-accent-light">
      {/* Header */}
      <header className="p-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <Card variant="elevated" className="animate-scale-in">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 p-3 rounded-xl bg-primary inline-flex">
                <Dog className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Criar conta no Cãolorias</CardTitle>
              <CardDescription>
                Comece a organizar a alimentação do seu cão
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Como podemos te chamar?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar minha conta grátis"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Entrar
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Benefits reminder */}
          <div className="space-y-3 px-2">
            {[
              "Cadastro rápido e 100% gratuito",
              "Registre refeições e petiscos",
              "Acompanhe o peso do seu cão",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="p-1 rounded-full bg-success/20">
                  <Check className="w-3 h-3 text-success" />
                </div>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cadastro;
