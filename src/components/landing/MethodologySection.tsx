import { CheckCircle2 } from 'lucide-react';

const methodologyPoints = [
  {
    title: 'Fontes Abertas',
    description: 'Trabalhamos exclusivamente com informação de fontes abertas, públicas e legalmente acessíveis.',
  },
  {
    title: 'Neutralidade',
    description: 'Mantemos uma posição estritamente neutral, apresentando factos sem tomar partido.',
  },
  {
    title: 'Relatórios Factuais',
    description: 'Os nossos relatórios apresentam factos verificáveis, organizados cronológica e tematicamente.',
  },
  {
    title: 'Documentação Legítima',
    description: 'Apenas trabalhamos com documentação obtida por meios legítimos e verificáveis.',
  },
  {
    title: 'Transparência Metodológica',
    description: 'A nossa metodologia é transparente e pode ser auditada por terceiros.',
  },
  {
    title: 'Identificação de Lacunas',
    description: 'Identificamos e reportamos lacunas documentais sem preencher com especulação.',
  },
];

export function MethodologySection() {
  return (
    <section id="metodologia" className="py-16 lg:py-24 bg-background">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Metodologia e Limites
            </h2>
            <p className="mt-4 text-muted-foreground">
              A nossa abordagem é rigorosa, transparente e focada na apresentação 
              objectiva de factos documentados. Trabalhamos dentro de limites 
              éticos e legais claros.
            </p>
            <p className="mt-4 text-muted-foreground">
              Não fazemos interpretações jurídicas, não emitimos pareceres e não 
              tiramos conclusões sobre situações apresentadas. O nosso trabalho 
              limita-se à organização e apresentação factual.
            </p>
          </div>
          
          <div className="grid gap-4">
            {methodologyPoints.map((point, index) => (
              <div 
                key={point.title}
                className="flex gap-3 animate-slide-in-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">{point.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
