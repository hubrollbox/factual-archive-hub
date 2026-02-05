import { FileText, Shield, Clock } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-12 sm:py-20 lg:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] bg-[length:60px_60px]" />
      
      <div className="container relative px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-6xl animate-fade-in">
            Apoio Factual e Organização Documental
          </h1>
          
          <p className="mt-4 text-base text-primary-foreground/80 sm:mt-6 sm:text-lg animate-fade-in [animation-delay:100ms]">
            Serviço técnico especializado em organização, análise factual e 
            estruturação de documentação. Baseado em fontes abertas e 
            documentação legítima.
          </p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs sm:mt-8 sm:gap-4 sm:text-sm text-primary-foreground/60 animate-fade-in [animation-delay:200ms]">
            <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Organização</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Cronologias</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Confidencialidade</span>
            </div>
          </div>
        </div>
        
        <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 p-4 text-center sm:mt-12 sm:p-6 animate-fade-in [animation-delay:300ms]">
          <p className="text-xs text-primary-foreground/70 sm:text-sm">
            <strong className="text-primary-foreground">Nota Importante:</strong> Este serviço não presta 
            aconselhamento jurídico, investigação privada ou vigilância. Limitamo-nos à 
            organização factual e estruturação documental.
          </p>
        </div>
      </div>
    </section>
  );
}
