import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Clock, Briefcase, Archive } from 'lucide-react';

const services = [
  {
    icon: FolderOpen,
    title: 'Organização Documental',
    description: 'Estruturação e classificação de documentação por tipo, data, entidade e relevância. Criação de índices e sistemas de arquivo eficientes.',
  },
  {
    icon: Clock,
    title: 'Cronologias Factuais',
    description: 'Elaboração de linhas temporais baseadas em documentos, apresentando factos de forma sequencial e neutral, sem interpretações jurídicas.',
  },
  {
    icon: Briefcase,
    title: 'Apoio Administrativo Jurídico',
    description: 'Suporte técnico na organização de dossiês para processos, preparação de documentação e identificação de lacunas documentais.',
  },
  {
    icon: Archive,
    title: 'Arquivo Digital e Físico',
    description: 'Implementação de sistemas de arquivo digital estruturado, com preparação para eventual arquivo físico quando necessário.',
  },
];

export function ServicesSection() {
  return (
    <section id="servicos" className="py-16 lg:py-24 bg-background">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Serviços
          </h2>
          <p className="mt-4 text-muted-foreground">
            Oferecemos serviços técnicos de organização e estruturação documental, 
            com foco na apresentação factual e objectiva.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service, index) => (
            <Card 
              key={service.title} 
              className="border-border bg-card shadow-soft-md transition-shadow hover:shadow-soft-lg animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <service.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
