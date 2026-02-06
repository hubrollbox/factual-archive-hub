import { useEffect, useState } from 'react';
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
  dossier?: {
    title: string;
  };
  document?: {
    title: string;
  } | null;
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
          dossier:dossiers(title),
          document:documents(title)
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

  async function handleCreateEntry(formData: FormData) {
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
        document_id: formData.document_id || null,
      });

      if (error) throw error;

      toast({
        title: 'Entrada criada',
        description: 'A entrada foi adicionada à cronologia.',
      });

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

  async function handleUpdateEntry(formData: FormData) {
    if (!user || !editingEntry) return;

    setIsSubmitting(true);
    try {
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
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Entrada atualizada',
        description: 'As alterações foram guardadas.',
      });

      setEditingEntry(null);
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a entrada.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEntry() {
    if (!user || !entryToDelete) return;

    try {
      const { error } = await supabase
        .from('chronology_entries')
        .delete()
        .eq('id', entryToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Entrada eliminada',
        description: 'A entrada foi removida da cronologia.',
      });

      setEntryToDelete(null);
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

  function handleEdit(entry: ChronologyEntry) {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingEntry(null);
  }

  function handleExportPDF() {
    window.print();
  }

  // Filter by dossier
  let filteredEntries = selectedDossier === 'all'
    ? entries
    : entries.filter(e => e.dossier_id === selectedDossier);

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredEntries = filteredEntries.filter(e =>
      e.title.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query) ||
      e.source_reference?.toLowerCase().includes(query)
    );
  }

  // Group entries by year
  const entriesByYear = filteredEntries.reduce((acc, entry) => {
    const year = new Date(entry.event_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {} as Record<number, ChronologyEntry[]>);

  const years = Object.keys(entriesByYear).sort((a, b) => Number(b) - Number(a));

  const initialFormData: FormData | undefined = editingEntry ? {
    dossier_id: editingEntry.dossier_id,
    event_date: editingEntry.event_date,
    title: editingEntry.title,
    description: editingEntry.description || '',
    source_reference: editingEntry.source_reference || '',
    document_id: editingEntry.document_id || '',
  } : undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
              Cronologia Factual
            </h1>
            <p className="mt-1 text-muted-foreground">
              Linha temporal de eventos baseada em documentos
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) handleCloseDialog();
              else setIsDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={dossiers.length === 0}>
                  <Plus className="h-4 w-4" />
                  Nova Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingEntry ? 'Editar Entrada' : 'Nova Entrada Cronológica'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEntry
                      ? 'Atualize os dados da entrada cronológica'
                      : 'Adicione um evento factual à cronologia'}
                  </DialogDescription>
                </DialogHeader>
                <ChronologyForm
                  dossiers={dossiers}
                  initialData={initialFormData}
                  isEditing={!!editingEntry}
                  isSubmitting={isSubmitting}
                  onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
                  onCancel={handleCloseDialog}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título, descrição ou fonte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-2xl font-bold text-center">Cronologia Factual</h1>
          <p className="text-center text-sm text-muted-foreground">
            Gerado em {new Date().toLocaleDateString('pt-PT')}
            {selectedDossier !== 'all' && ` • Dossiê: ${dossiers.find(d => d.id === selectedDossier)?.title}`}
          </p>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-12 print:hidden">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className="print:hidden">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Cronologia vazia</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dossiers.length === 0
                  ? 'Crie primeiro um dossiê para adicionar entradas.'
                  : searchQuery
                  ? 'Nenhuma entrada corresponde à pesquisa.'
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
                    <ChronologyEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEdit}
                      onDelete={(id) => setEntryToDelete(id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Print-only list view */}
        <div className="hidden print:block">
          {years.map((year) => (
            <div key={year} className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2">{year}</h2>
              {entriesByYear[Number(year)].map((entry) => (
                <div key={entry.id} className="mb-3 pl-4 border-l-2 border-gray-300">
                  <p className="text-sm text-gray-600">
                    {new Date(entry.event_date).toLocaleDateString('pt-PT')}
                  </p>
                  <p className="font-medium">{entry.title}</p>
                  {entry.description && (
                    <p className="text-sm text-gray-700">{entry.description}</p>
                  )}
                  {entry.source_reference && (
                    <p className="text-xs text-gray-500">Fonte: {entry.source_reference}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. A entrada será permanentemente eliminada da cronologia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
