import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, AlertTriangle } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  subject: z.string().max(200, 'Assunto muito longo').optional(),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(2000, 'Mensagem muito longa'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        message: data.message,
      });

      if (error) throw error;

      toast({
        title: 'Mensagem enviada',
        description: 'Entraremos em contacto brevemente.',
      });
      reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-12 sm:py-16 lg:py-24 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Contacto
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
              Para solicitar os nossos serviços ou esclarecer dúvidas, 
              utilize o formulário abaixo.
            </p>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-4 shadow-soft-md sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="O seu nome"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  placeholder="Assunto da mensagem"
                  {...register('subject')}
                  className={errors.subject ? 'border-destructive' : ''}
                />
                {errors.subject && (
                  <p className="text-xs text-destructive">{errors.subject.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  placeholder="Descreva o seu pedido ou questão..."
                  rows={5}
                  {...register('message')}
                  className={errors.message ? 'border-destructive' : ''}
                />
                {errors.message && (
                  <p className="text-xs text-destructive">{errors.message.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Mensagem
              </Button>
            </form>
            
            <div className="mt-6 rounded-md border border-warning/30 bg-warning/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Aviso Legal</p>
                  <p className="mt-1 text-muted-foreground">
                    Este serviço destina-se exclusivamente a organização documental e 
                    apresentação factual. Não substitui nem constitui aconselhamento 
                    jurídico. Para questões legais, consulte um advogado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
