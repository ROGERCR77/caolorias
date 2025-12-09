import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dog, Home, UtensilsCrossed, Apple, Scale, LogOut, User, ClipboardList, BookOpen, Crown, ChefHat } from "lucide-react";
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

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/app/hoje", label: "Hoje", icon: Home },
  { path: "/app/caes", label: "Cães", icon: Dog },
  { path: "/app/refeicoes", label: "Refeições", icon: UtensilsCrossed },
  { path: "/app/plano-alimentar", label: "Plano", icon: ClipboardList },
  { path: "/app/peso-progresso", label: "Peso", icon: Scale },
];

const moreNavItems = [
  { path: "/app/alimentos", label: "Alimentos", icon: Apple },
  { path: "/app/racas", label: "Raças", icon: BookOpen },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const allNavItems = [...navItems, ...moreNavItems];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b shadow-sm safe-top">
        <div className="container px-4">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Logo */}
            <Link to="/app/hoje" className="flex items-center gap-2 press-effect">
              <div className="p-1.5 rounded-lg bg-gradient-hero">
                <Dog className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg hidden sm:block">Cãolorias</span>
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
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
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

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 press-effect">
                  <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/perfil"><User className="w-4 h-4 mr-2" />Meu Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/assinatura"><Crown className="w-4 h-4 mr-2" />Assinatura</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/receitas"><ChefHat className="w-4 h-4 mr-2" />Receitas</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-6">
        <div className="page-enter">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t lg:hidden safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 flex-1 max-w-16 press-effect",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:text-primary"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold transition-all duration-200",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
