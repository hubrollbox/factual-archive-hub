import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
              <Smartphone className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">Instalar Apoio Factual</CardTitle>
            <CardDescription>
              Instale a aplicação no seu dispositivo para acesso rápido e offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInstalled ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">
                  A aplicação já está instalada no seu dispositivo!
                </p>
                <Link to="/dashboard">
                  <Button className="w-full">Ir para o Dashboard</Button>
                </Link>
              </div>
            ) : isIOS ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Para instalar no iOS:
                </p>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      1
                    </span>
                    <span>Toque no botão <strong>Partilhar</strong> (ícone de seta) no Safari</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      2
                    </span>
                    <span>Selecione <strong>"Adicionar ao Ecrã Principal"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      3
                    </span>
                    <span>Toque em <strong>Adicionar</strong> para confirmar</span>
                  </li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Acesso rápido a partir do ecrã inicial
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Funciona offline (funcionalidades básicas)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Sem necessidade de loja de apps
                  </li>
                </ul>
                <Button className="w-full gap-2" onClick={handleInstall}>
                  <Download className="h-4 w-4" />
                  Instalar Aplicação
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para instalar, utilize o menu do seu navegador e selecione "Instalar aplicação" ou "Adicionar ao ecrã inicial".
                </p>
                <Link to="/">
                  <Button variant="outline" className="w-full">Voltar ao Início</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
