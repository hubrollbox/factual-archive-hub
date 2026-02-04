import { FileText, Shield, Clock } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 lg:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] bg-[length:60px_60px]" />
      
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl animate-fade-in">
            Apoio Factual e Organização Documental
          </h1>
          
          <p className="mt-6 text-lg text-primary-foreground/80 animate-fade-in [animation-delay:100ms]">
            Serviço técnico especializado em organização, análise factual e 
            estruturação de documentação. Baseado em fontes abertas e 
            documentação legítima.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-primary-foreground/60 animate-fade-in [animation-delay:200ms]">
            <div className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2">
              <FileText className="h-4 w-4" />
              <span>Organização Documental</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2">
              <Clock className="h-4 w-4" />
              <span>Cronologias Factuais</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2">
              <Shield className="h-4 w-4" />
              <span>Confidencialidade</span>
            </div>
          </div>
        </div>
        
        <div className="mx-auto mt-12 max-w-2xl rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 p-6 text-center animate-fade-in [animation-delay:300ms]">
          <p className="text-sm text-primary-foreground/70">
            <strong className="text-primary-foreground">Nota Importante:</strong> Este serviço não presta 
            aconselhamento jurídico, investigação privada ou vigilância. Limitamo-nos à 
            organização factual e estruturação documental.
          </p>
        </div>
      </div>
    </section>
  );
}
