import { XCircle } from 'lucide-react';

const notServices = [
  {
    title: 'Aconselhamento Jurídico',
    description: 'Não prestamos aconselhamento, pareceres ou opiniões jurídicas. Para questões legais, consulte um advogado.',
  },
  {
    title: 'Investigação Privada',
    description: 'Não realizamos investigações privadas, recolha de provas por meios próprios ou vigilância de qualquer tipo.',
  },
  {
    title: 'Vigilância ou Seguimento',
    description: 'Não efectuamos seguimentos, vigilância pessoal ou qualquer actividade que invada a privacidade de terceiros.',
  },
  {
    title: 'Interpretações ou Pareceres',
    description: 'Não emitimos interpretações, análises subjectivas ou conclusões sobre situações jurídicas ou factuais.',
  },
];

export function NotServicesSection() {
  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            O Que Não Fazemos
          </h2>
          <p className="mt-4 text-muted-foreground">
            É importante clarificar os limites do nosso serviço para garantir 
            expectativas adequadas.
          </p>
        </div>
        
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-4">
            {notServices.map((item, index) => (
              <div 
                key={item.title}
                className="flex gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <XCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
