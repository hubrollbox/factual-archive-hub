import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock, Loader2, Search, FileDown } from 'lucide-react';
import { ChronologyEntryCard } from '@/components/chronology/ChronologyEntryCard';
import { ChronologyForm } from '@/components/chronology/ChronologyForm';

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
  document_id: string | null;
  created_at: string;
  dossier?: { title: string };
  document?: { title: string } | null;
}

interface FormData {
  dossier_id: string;
  event_date: string;
  title: string;
  description: string;
  source_reference: string;
  document_id: string;
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
  const [searchQuery, setSearchQuery] = useState('');

  const [editingEntry, setEditingEntry] = useState<ChronologyEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  /* -------------------- EFFECTS -------------------- */

  useEffect(() => {
    if (!user?.id) return;
    fetchDossiers();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchEntries();
  }, [user?.id, selectedDossier, searchQuery]);

  /* -------------------- DATA -------------------- */

  async function fetchDossiers() {
    const { data, error } = await supabase
      .from('dossiers')
      .select('id, title')
      .eq('user_id', user!.id)
      .order('title');

    if (error) {
      console.error(error);
      return;
    }
    setDossiers(data ?? []);
  }

  async function fetchEntries() {
    setLoading(true);

    let query = supabase
      .from('chronology_entries')
      .select(`
        *,
        dossier:dossiers(title),
        document:documents(title)
      `)
      .eq('user_id', user!.id);

    if (selectedDossier !== 'all') {
      query = query.eq('dossier_id', selectedDossier);
    }

    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query = query.or(
        `title.ilike.${q},description.ilike.${q},source_reference.ilike.${q}`
      );
    }

    const { data, error } = await query.order('event_date', { ascending: true });

    if (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a cronologia.',
        variant: 'destructive',
      });
    } else {
      setEntries(data ?? []);
    }

    setLoading(false);
  }

  /* -------------------- CRUD -------------------- */

  async function handleCreateEntry(formData: FormData) {
    setIsSubmitting(true);

    const { error } = await supabase.from('chronology_entries').insert({
      user_id: user!.id,
      dossier_id: formData.dossier_id,
      event_date: formData.event_date,
      title: formData.title,
      description: formData.description || null,
      source_reference: formData.source_reference || null,
      document_id: formData.document_id || null,
    });

    if (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Falha ao criar entrada.', variant: 'destructive' });
    } else {
      toast({ title: 'Entrada criada' });
      setIsDialogOpen(false);
      fetchEntries();
    }

    setIsSubmitting(false);
  }

  async function handleUpdateEntry(formData: FormData) {
    if (!editingEntry) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('chronology_entries')
      .update({
        event_date: formData.event_date,
        title: formData.title,
        description: formData.description || null,
        source_reference: formData.source_reference || null,
        document_id: formData.document_id || null,
      })
      .eq('id', editingEntry.id)
      .eq('user_id', user!.id);

    if (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Falha ao atualizar.', variant: 'destructive' });
    } else {
      toast({ title: 'Entrada atualizada' });
      setEditingEntry(null);
      setIsDialogOpen(false);
      fetchEntries();
    }

    setIsSubmitting(false);
  }

  async function handleDeleteEntry() {
    if (!entryToDelete) return;

    const { error } = await supabase
      .from('chronology_entries')
      .delete()
      .eq('id', entryToDelete)
      .eq('user_id', user!.id);

    if (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Falha ao eliminar.', variant: 'destructive' });
    } else {
      toast({ title: 'Entrada eliminada' });
      setEntryToDelete(null);
      fetchEntries();
    }
  }

  /* -------------------- DERIVED -------------------- */

  const entriesByYear = useMemo(() => {
    const acc: Record<number, ChronologyEntry[]> = {};

    for (const entry of entries) {
      const year = new Date(entry.event_date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(entry);
    }

    Object.values(acc).forEach(list =>
      list.sort((a, b) => a.event_date.localeCompare(b.event_date))
    );

    return acc;
  }, [entries]);

  const years = useMemo(
    () => Object.keys(entriesByYear).map(Number).sort((a, b) => b - a),
    [entriesByYear]
  );

  const initialFormData: FormData | undefined = editingEntry
    ? {
        dossier_id: editingEntry.dossier_id,
        event_date: editingEntry.event_date,
        title: editingEntry.title,
        description: editingEntry.description || '',
        source_reference: editingEntry.source_reference || '',
        document_id: editingEntry.document_id || '',
      }
    : undefined;

  /* -------------------- UI -------------------- */

  function handleExportPDF() {
    window.print();
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
              Cronologia Factual
            </h1>
            <p className="mt-1 text-muted-foreground">
              Timeline de eventos organizados por dossiê
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingEntry(null);
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEntry ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
                  <DialogDescription>
                    {editingEntry ? 'Atualize os dados da entrada cronológica.' : 'Adicione um novo evento à cronologia.'}
                  </DialogDescription>
                </DialogHeader>
                <ChronologyForm
                  dossiers={dossiers}
                  initialData={initialFormData}
                  isSubmitting={isSubmitting}
                  onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingEntry(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar entradas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedDossier} onValueChange={setSelectedDossier}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por dossiê" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os dossiês</SelectItem>
              {dossiers.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Sem entradas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ainda não existem entradas cronológicas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {years.map(year => (
              <div key={year}>
                <h2 className="mb-4 text-lg font-semibold text-foreground">{year}</h2>
                <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-0 before:h-full before:w-px before:bg-border">
                  {entriesByYear[year].map(entry => (
                    <ChronologyEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={() => {
                        setEditingEntry(entry);
                        setIsDialogOpen(true);
                      }}
                      onDelete={() => setEntryToDelete(entry.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar entrada?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser revertida. A entrada será permanentemente eliminada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEntry}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
