import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dog, Home, UtensilsCrossed, Apple, Scale, LogOut, User, ClipboardList, BookOpen, Crown, ChefHat, Heart, Syringe, Activity, Leaf, FileText, MoreHorizontal, Settings, History, BarChart3, AlertTriangle, HelpCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/app/hoje", label: "Hoje", icon: Home },
  { path: "/app/caes", label: "Cães", icon: Dog },
  { path: "/app/refeicoes", label: "Refeições", icon: UtensilsCrossed },
  { path: "/app/saude-digestiva", label: "Saúde", icon: Heart },
];

const moreNavItems = [
  { path: "/app/peso-progresso", label: "Peso & Progresso", icon: Scale, premium: false },
  { path: "/app/alimentos", label: "Alimentos", icon: Apple, premium: false },
  { path: "/app/racas", label: "Raças", icon: BookOpen, premium: false },
  { path: "/app/plano-alimentar", label: "Plano Alimentar", icon: ClipboardList, premium: true },
  { path: "/app/carteira-saude", label: "Carteira de Saúde", icon: Syringe, premium: true },
  { path: "/app/atividade", label: "Atividade Física", icon: Activity, premium: false },
  { path: "/app/transicao", label: "Transição Alimentar", icon: Leaf, premium: true },
  { path: "/app/relatorio-vet", label: "Relatório Vet", icon: FileText, premium: true },
  { path: "/app/receitas", label: "Receitas", icon: ChefHat, premium: true },
  { path: "/app/historico-insights", label: "Histórico IA", icon: History, premium: true },
];

const quickActions = [
  { path: "/app/perfil", label: "Configurações", icon: Settings },
  { path: "/app/assinatura", label: "Assinatura", icon: Crown },
];

const aboutItems = [
  { path: "/app/aviso-importante", label: "Aviso Importante", icon: AlertTriangle },
  { path: "/app/como-usar", label: "Como Usar", icon: HelpCircle },
  { path: "/app/privacidade-dados", label: "Privacidade", icon: Shield },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleMoreNavClick = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  const allNavItems = [...navItems, ...moreNavItems];
  const isMoreActive = moreNavItems.some(item => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header - Modern iOS Style */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/30 shadow-sm">
        <div 
          className="flex items-center justify-between px-5"
          style={{ 
            paddingTop: 'max(24px, calc(var(--safe-area-inset-top) + 12px))',
            paddingBottom: '12px'
          }}
        >
          {/* Logo - Left */}
          <Link to="/app/hoje" className="flex items-center gap-3 press-effect">
            <div className="w-11 h-11 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-md">
              <Dog className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:block text-foreground">Cãolorias</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {allNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Menu - Right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 press-effect h-11 px-2 rounded-2xl hover:bg-muted/80"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="hidden sm:block text-sm font-semibold max-w-28 truncate text-foreground">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card/98 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-xl mx-1">
                <Link to="/app/perfil" className="flex items-center gap-2">
                  <User className="w-4 h-4" />Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl mx-1">
                <Link to="/app/assinatura" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />Assinatura
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-xl mx-1">
                <Link to="/app/aviso-importante" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />Aviso Importante
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl mx-1">
                <Link to="/app/como-usar" className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />Como Usar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl mx-1">
                <Link to="/app/privacidade-dados" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />Privacidade
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive cursor-pointer rounded-xl mx-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-[calc(88px+var(--safe-area-inset-bottom))] lg:pb-6">
        <div className="page-enter">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Enhanced iOS Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/30 shadow-lg lg:hidden">
        <div 
          className="flex items-stretch justify-around px-2"
          style={{ 
            paddingBottom: 'max(8px, var(--safe-area-inset-bottom))',
            paddingTop: '8px',
            minHeight: '72px'
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 flex-1 press-effect relative rounded-2xl mx-0.5 transition-all duration-200",
                  "min-h-[56px] min-w-[56px]",
                  isActive && "bg-primary/10"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/20"
                )}>
                  <item.icon 
                    className={cn(
                      "w-7 h-7 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold transition-colors duration-200 leading-tight",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* More Button with Sheet */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 flex-1 press-effect relative rounded-2xl mx-0.5 transition-all duration-200",
                  "min-h-[56px] min-w-[56px]",
                  isMoreActive && "bg-primary/10"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isMoreActive && "bg-primary/20"
                )}>
                  <MoreHorizontal 
                    className={cn(
                      "w-7 h-7 transition-all duration-200",
                      isMoreActive ? "text-primary" : "text-muted-foreground"
                    )} 
                    strokeWidth={isMoreActive ? 2.5 : 1.8}
                  />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold transition-colors duration-200 leading-tight",
                  isMoreActive ? "text-primary" : "text-muted-foreground"
                )}>
                  Mais
                </span>
              </button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="rounded-t-3xl border-t-0 bg-card/98 backdrop-blur-xl"
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="text-center text-lg font-bold">Mais opções</SheetTitle>
              </SheetHeader>
              
              {/* Quick Actions */}
              <div className="flex gap-3 mb-4">
                {quickActions.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleMoreNavClick(item.path)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-200 press-effect",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/60 hover:bg-muted text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Grid */}
              <div className="grid grid-cols-3 gap-3">
                {moreNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleMoreNavClick(item.path)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-200 press-effect relative",
                        isActive 
                          ? "bg-primary/15 border-2 border-primary shadow-sm" 
                          : "bg-muted/40 border-2 border-transparent hover:bg-muted/60"
                      )}
                    >
                      {item.premium && (
                        <Crown className="absolute top-2 right-2 w-3.5 h-3.5 text-warning" />
                      )}
                      <div className={cn(
                        "p-2 rounded-xl",
                        isActive ? "bg-primary/20" : "bg-background/60"
                      )}>
                        <item.icon 
                          className={cn(
                            "w-6 h-6",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} 
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-medium text-center leading-tight",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* About Section */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3 text-center">Sobre o App</p>
                <div className="flex gap-2">
                  {aboutItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleMoreNavClick(item.path)}
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-200 press-effect",
                          isActive 
                            ? "bg-primary/15 text-primary" 
                            : "bg-muted/40 hover:bg-muted/60 text-muted-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
