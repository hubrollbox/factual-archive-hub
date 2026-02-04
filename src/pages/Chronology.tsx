import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock, Loader2, Calendar, Trash2 } from 'lucide-react';

interface Dossier {
  id: string;
  title: string;
}

interface ChronologyEntry {
  id: string;
  dossier_id: string;
  event_date: string;
  title: string;
  description: string | null;
  source_reference: string | null;
  created_at: string;
  dossier?: {
    title: string;
  };
}

export default function Chronology() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [entries, setEntries] = useState<ChronologyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<string>('all');

  const [formData, setFormData] = useState({
    dossier_id: '',
    event_date: '',
    title: '',
    description: '',
    source_reference: '',
  });

  useEffect(() => {
    fetchDossiers();
    fetchEntries();
  }, [user]);

  async function fetchDossiers() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, title')
        .eq('user_id', user.id)
        .order('title');

      if (error) throw error;
      setDossiers(data || []);
    } catch (error) {
      console.error('Error fetching dossiers:', error);
    }
  }

  async function fetchEntries() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chronology_entries')
        .select(`
          *,
          dossier:dossiers(title)
        `)
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a cronologia.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('chronology_entries').insert({
        user_id: user.id,
        dossier_id: formData.dossier_id,
        event_date: formData.event_date,
        title: formData.title,
        description: formData.description || null,
        source_reference: formData.source_reference || null,
      });

      if (error) throw error;

      toast({
        title: 'Entrada criada',
        description: 'A entrada foi adicionada à cronologia.',
      });

      setFormData({ dossier_id: '', event_date: '', title: '', description: '', source_reference: '' });
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error) {
      console.error('Error creating entry:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a entrada.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chronology_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Entrada eliminada',
        description: 'A entrada foi removida da cronologia.',
      });

      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível eliminar a entrada.',
        variant: 'destructive',
      });
    }
  }

  const filteredEntries = selectedDossier === 'all'
    ? entries
    : entries.filter(e => e.dossier_id === selectedDossier);

  // Group entries by year
  const entriesByYear = filteredEntries.reduce((acc, entry) => {
    const year = new Date(entry.event_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {} as Record<number, ChronologyEntry[]>);

  const years = Object.keys(entriesByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
              Cronologia Factual
            </h1>
            <p className="mt-1 text-muted-foreground">
              Linha temporal de eventos baseada em documentos
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={dossiers.length === 0}>
                <Plus className="h-4 w-4" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Entrada Cronológica</DialogTitle>
                <DialogDescription>
                  Adicione um evento factual à cronologia
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dossier">Dossiê *</Label>
                  <Select
                    value={formData.dossier_id}
                    onValueChange={(v) => setFormData({ ...formData, dossier_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione um dossiê" />
                    </SelectTrigger>
                    <SelectContent>
                      {dossiers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Data do Evento *</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source_reference">Fonte/Referência</Label>
                    <Input
                      id="source_reference"
                      value={formData.source_reference}
                      onChange={(e) => setFormData({ ...formData, source_reference: e.target.value })}
                      placeholder="Documento, página, etc."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Descrição breve do evento"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Detalhada</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes factuais do evento"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !formData.dossier_id}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Entrada
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-4">
          <Select value={selectedDossier} onValueChange={setSelectedDossier}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por dossiê" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os dossiês</SelectItem>
              {dossiers.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Cronologia vazia</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dossiers.length === 0
                  ? 'Crie primeiro um dossiê para adicionar entradas.'
                  : 'Adicione entradas para construir a linha temporal.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {years.map((year) => (
              <div key={year}>
                <h2 className="mb-4 font-display text-xl font-semibold text-foreground">{year}</h2>
                <div className="relative border-l-2 border-border pl-6 space-y-4">
                  {entriesByYear[Number(year)].map((entry) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardDescription className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(entry.event_date).toLocaleDateString('pt-PT', {
                                  day: 'numeric',
                                  month: 'long',
                                })}
                              </CardDescription>
                              <CardTitle className="text-base font-semibold mt-1">
                                {entry.title}
                              </CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground">{entry.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {entry.dossier && (
                              <span className="rounded bg-secondary px-2 py-0.5">
                                {entry.dossier.title}
                              </span>
                            )}
                            {entry.source_reference && (
                              <span className="rounded bg-secondary px-2 py-0.5">
                                Fonte: {entry.source_reference}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
