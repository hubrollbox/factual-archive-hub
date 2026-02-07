import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Plus, Loader2, Trash2, Edit, Calendar, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import { forwardRef } from 'react';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';
type DocumentType = 'pdf' | 'imagem' | 'texto' | 'outro';

interface Dossier {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  reference_code: string | null;
  status: DossierStatus;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  document_type: DocumentType;
  file_path: string | null;
  file_name: string | null;
  entity: string | null;
  document_date: string | null;
  created_at: string;
}

interface ChronologyEntry {
  id: string;
  date: string;
  description: string;
  source: string | null;
}

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const documentTypeLabels: Record<DocumentType, string> = {
  pdf: 'PDF',
  imagem: 'Imagem',
  texto: 'Texto',
  outro: 'Outro',
};

const dossierSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().nullable(),
  client_name: z.string().nullable(),
  reference_code: z.string().nullable(),
  status: z.enum(['em_analise', 'pendente', 'completo', 'arquivado']),
});

const docSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().nullable(),
  document_type: z.enum(['pdf', 'imagem', 'texto', 'outro']),
  entity: z.string().nullable(),
  document_date: z.string().nullable(),
  file: z.any().optional(), // Para upload
});

type DossierForm = z.infer<typeof dossierSchema>;
type DocForm = z.infer<typeof docSchema>;

// Componente para Relatório Final (exemplo simples)
const DossierReportView = forwardRef<HTMLDivElement, { dossier: Dossier; docs: Document[]; chronos: ChronologyEntry[]; lacunas: string[] }>(
  ({ dossier, docs, chronos, lacunas }, ref) => (
    <div ref={ref} className="p-4">
      <h1>Relatório Factual - {dossier.title}</h1>
      <p>Data: {format(new Date(), 'dd/MM/yyyy', { locale: pt })}</p>
      <p>Disclaimer: Organização factual, não jurídico.</p>
      {/* Adicione seções como antes */}
    </div>
  )
);

export default function DossierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chronologies, setChronologies] = useState<ChronologyEntry[]>([]);
  const [lacunas, setLacunas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  const dossierForm = useForm<DossierForm>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      title: '',
      description: null,
      client_name: null,
      reference_code: null,
      status: 'em_analise',
    },
  });

  const docForm = useForm<DocForm>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      title: '',
      description: null,
      document_type: 'outro',
      entity: null,
      document_date: null,
    },
  });

  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrintReport = useReactToPrint({
    content: () => reportRef.current,
  });

  useEffect(() => {
    if (user && id) {
      fetchAllData();
    }
  }, [user, id]);

  async function fetchAllData() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          documents:documents(*),
          chronology_entries:chronology_entries(*)
        `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      if (!data) {
        navigate('/dashboard/dossiers');
        return;
      }

      setDossier(data);
      setDocuments(data.documents || []);
      setChronologies(data.chronology_entries || []);
      dossierForm.reset({
        title: data.title,
        description: data.description || '',
        client_name: data.client_name || '',
        reference_code: data.reference_code || '',
        status: data.status,
      });

      // Calcular lacunas simples
      const newLacunas = [];
      if (data.documents.length === 0) newLacunas.push('Ausência de documentos.');
      if (data.chronology_entries.length === 0) newLacunas.push('Cronologia vazia.');
      setLacunas(newLacunas);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao carregar dossiê.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateDossier(data: DossierForm) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('dossiers')
        .update(data)
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      toast({ title: 'Atualizado' });
      setIsEditMode(false);
      fetchAllData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDocument(data: DocForm) {
    setLoading(true);
    try {
      let filePath = null;
      if (data.file) {
        const { data: uploadData, error: uploadError } = await supabase.storage.from('documents').upload(`dossier_\( {id}/ \){data.file.name}`, data.file);
        if (uploadError) throw uploadError;
        filePath = uploadData.path;
      }

      const { error } = await supabase.from('documents').insert({
        dossier_id: id,
        user_id: user!.id,
        title: data.title,
        description: data.description,
        document_type: data.document_type,
        entity: data.entity,
        document_date: data.document_date,
        file_path: filePath,
        file_name: data.file?.name || null,
      });

      if (error) throw error;
      toast({ title: 'Adicionado' });
      setIsDocDialogOpen(false);
      docForm.reset();
      fetchAllData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDocument() {
    if (!docToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docToDelete)
        .eq('user_id', user!.id);

      if (error) throw error;
      toast({ title: 'Eliminado' });
      setIsDeleteConfirmOpen(false);
      setDocToDelete(null);
      fetchAllData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro' });
    } finally {
      setLoading(false);
    }
  }

  // Adicione função similar para chronologies se precisar

  if (loading) return <DashboardLayout><Loader2 className="animate-spin" /></DashboardLayout>;
  if (error) return <DashboardLayout><Alert variant="destructive">{error}</Alert></DashboardLayout>;
  if (!dossier) return null;

  return (
    <DashboardLayout>
      {/* Header com botão relatório */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/dossiers')}><ArrowLeft /></Button>
        <h1>{dossier.title}</h1>
        <Badge>{statusLabels[dossier.status]}</Badge>
        <Button onClick={() => setIsEditMode(true)}><Edit /></Button>
        <Button onClick={handlePrintReport}><FileText /> Relatório Final</Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="documents">Docs ({documents.length})</TabsTrigger>
          <TabsTrigger value="chronology">Cronologia ({chronologies.length})</TabsTrigger>
          <TabsTrigger value="gaps">Lacunas ({lacunas.length})</TabsTrigger>
        </TabsList>
        {/* Conteúdo tabs similar, com lacunas em lista */}
        {/* ... */}
      </Tabs>

      {/* Dialogs para edit/add/delete */}
      {/* ... */}

      {/* Print hidden */}
      <div className="hidden"><DossierReportView ref={reportRef} dossier={dossier} docs={documents} chronos={chronologies} lacunas={lacunas} /></div>
    </DashboardLayout>
  );
}