import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FileText, LogIn, Menu, Download } from 'lucide-react';

const navLinks = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#metodologia', label: 'Metodologia' },
  { href: '#condicoes', label: 'Condições' },
  { href: '#contacto', label: 'Contacto' },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center justify-between sm:h-16">
        <Link to="/" className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          <span className="font-display text-base font-semibold text-primary sm:text-lg">
            Apoio Factual
          </span>
        </Link>
        
        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map(link => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/instalar" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Instalar
            </Button>
          </Link>
          <Link to="/login" className="hidden sm:block">
            <Button variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              Área Privada
            </Button>
          </Link>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                {navLinks.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="my-2 border-border" />
                <Link to="/instalar" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Instalar App
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <LogIn className="h-4 w-4" />
                    Área Privada
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
