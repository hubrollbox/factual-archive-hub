import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, LogIn } from 'lucide-react';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-semibold text-primary">
            Apoio Factual
          </span>
        </Link>
        
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#servicos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Serviços
          </a>
          <a href="#metodologia" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Metodologia
          </a>
          <a href="#condicoes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Condições
          </a>
          <a href="#contacto" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contacto
          </a>
        </nav>

        <Link to="/login">
          <Button variant="outline" size="sm" className="gap-2">
            <LogIn className="h-4 w-4" />
            Área Privada
          </Button>
        </Link>
      </div>
    </header>
  );
}
