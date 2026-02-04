import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, FileText, Lock, ShieldAlert } from 'lucide-react';

const conditions = [
  {
    icon: UserCheck,
    title: 'Interesse Legítimo',
    description: 'O cliente deve demonstrar interesse legítimo na documentação solicitada. Reservamo-nos o direito de recusar pedidos sem justificação adequada.',
  },
  {
    icon: FileText,
    title: 'Briefing Escrito',
    description: 'Todos os pedidos devem ser formalizados por escrito, com descrição clara do âmbito, objectivos e documentação relevante.',
  },
  {
    icon: Lock,
    title: 'Confidencialidade',
    description: 'Toda a informação tratada é confidencial. Mantemos sigilo absoluto sobre os dossiês e respectivo conteúdo.',
  },
  {
    icon: ShieldAlert,
    title: 'Direito de Recusa',
    description: 'Reservamo-nos o direito de recusar pedidos que consideremos inadequados, ilegítimos ou fora do âmbito do nosso serviço.',
  },
];

export function ConditionsSection() {
  return (
    <section id="condicoes" className="py-16 lg:py-24 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Condições de Prestação de Serviço
          </h2>
          <p className="mt-4 text-muted-foreground">
            Para garantir a qualidade e integridade do nosso serviço, 
            aplicamos as seguintes condições.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {conditions.map((condition, index) => (
            <Card 
              key={condition.title}
              className="border-border bg-card shadow-soft-sm animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/20">
                    <condition.icon className="h-4 w-4 text-accent" />
                  </div>
                  <CardTitle className="text-base font-semibold">{condition.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{condition.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
