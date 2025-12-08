import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dog, Menu, X } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="p-1.5 rounded-lg bg-primary">
              <Dog className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Cãolorias</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/cadastro">Criar conta</Link>
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t animate-slide-down">
            <nav className="flex flex-col gap-2">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/login" onClick={() => setIsOpen(false)}>Entrar</Link>
              </Button>
              <Button asChild variant="default" className="w-full">
                <Link to="/cadastro" onClick={() => setIsOpen(false)}>Criar conta</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
