import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Dossier {
  id: string;
  title: string;
}

interface Document {
  id: string;
  title: string;
}

interface FormData {
  dossier_id: string;
  event_date: string;
  title: string;
  description: string;
  source_reference: string;
  document_id: string;
}

interface ChronologyFormProps {
  dossiers: Dossier[];
  initialData?: FormData;
  isEditing?: boolean;
  isSubmitting: boolean;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export function ChronologyForm({
  dossiers,
  initialData,
  isEditing = false,
  isSubmitting,
  onSubmit,
  onCancel,
}: ChronologyFormProps) {
  const [formData, setFormData] = useState<FormData>(
    initialData || {
      dossier_id: '',
      event_date: '',
      title: '',
      description: '',
      source_reference: '',
      document_id: '',
    }
  );

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    if (formData.dossier_id) {
      fetchDocuments(formData.dossier_id);
    } else {
      setDocuments([]);
    }
  }, [formData.dossier_id]);

  async function fetchDocuments(dossierId: string) {
    setLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title')
        .eq('dossier_id', dossierId)
        .order('title');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dossier">Dossiê *</Label>
        <Select
          value={formData.dossier_id}
          onValueChange={(v) => setFormData({ ...formData, dossier_id: v, document_id: '' })}
          disabled={isEditing}
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

      {formData.dossier_id && (
        <div className="space-y-2">
          <Label htmlFor="document">Documento Associado (opcional)</Label>
          <Select
            value={formData.document_id}
            onValueChange={(v) => setFormData({ ...formData, document_id: v === 'none' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingDocuments ? 'A carregar...' : 'Nenhum documento'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum documento</SelectItem>
              {documents.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.dossier_id}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar' : 'Criar Entrada'}
        </Button>
      </div>
    </form>
  );
}
