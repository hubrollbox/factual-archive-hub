import { useEffect, useState, useRef, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

/* ===================== TIPOS ===================== */

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  reference_code: string | null;
  status: DossierStatus;
  created_at: string;
}

interface DocumentRow {
  id: string;
  title: string;
  document_type: 'pdf' | 'imagem' | 'texto' | 'outro';
  document_date: string | null;
  description: string | null;
  entity: string | null;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
}

/* ===================== LABELS ===================== */

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const docTypeLabels: Record<string, string> = {
  pdf: 'PDF',
  imagem: 'Imagem',
  texto: 'Texto',
  outro: 'Outro',
};

/* ===================== ZOD SCHEMA DOCUMENTO ===================== */

const docSchema = z.object({
  title: z.string().min(3, 'Título obrigatório'),
  document_type: z.enum(['pdf', 'imagem', 'texto', 'outro']),
  document_date: z.string().optional(),
  entity: z.string().optional(),
  description: z.string().optional(),
});

type DocForm = z.infer<typeof docSchema>;

/* ===================== FORMATAÇÃO ===================== */

function formatDocReference(doc: DocumentRow) {
  const parts: string[] = [];

  if (doc.entity) parts.push(doc.entity.toUpperCase());
  parts.push(`${doc.title}.`);
  parts.push(`[${docTypeLabels[doc.document_type] || doc.document_type}].`);

  if (doc.document_date) {
    parts.push(`${new Date(doc.document_date).getFullYear()}.`);
  }

  if (doc.description) parts.push(doc.description);

  return parts.join(' ');
}

/* ===================== RELATÓRIO ===================== */

const DossierReportView = forwardRef<
  HTMLDivElement,
  { dossier: Dossier; documents: DocumentRow[]; lacunas: string[] }
>(({ dossier, documents, lacunas }, ref) => (
  <div ref={ref} className="p-6 text-sm">
    <h1 className="text-xl font-bold mb-2">Relatório Factual</h1>

    <p><strong>Dossiê:</strong> {dossier.title}</p>
    <p><strong>Data:</strong> {format(new Date(), 'dd/MM/yyyy', { locale: pt })}</p>

    <p className="mt-4 italic">
      Organização factual e documental. Não constitui aconselhamento jurídico.
    </p>

    <h2 className="mt-6 font-semibold">Referências Documentais</h2>
    <ol className="list-decimal ml-6">
      {documents
        .sort((a, b) => (a.document_date ?? '').localeCompare(b.document_date ?? ''))
        .map(d => (
          <li key={d.id} className="mb-1">
            {formatDocReference(d)}
          </li>
        ))}
    </ol>

    {lacunas.length > 0 && (
      <>
        <h2 className="mt-6 font-semibold">Lacunas Identificadas</h2>
        <ul className="list-disc ml-6">
          {lacunas.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </>
    )}
  </div>
));

/* ===================== COMPONENTE PRINCIPAL ===================== */

export default function DossierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [lacunas, setLacunas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  const docForm = useForm<DocForm>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      title: '',
      document_type: 'outro',
      document_date: '',
      entity: '',
      description: '',
    },
  });

  const { register, handleSubmit, formState: { errors } } = docForm;

  const [statusChanging, setStatusChanging] = useState(false);

  function handlePrintReport() {
    window.print();
  }

  async function handleStatusChange(newStatus: DossierStatus) {
    if (!dossier || newStatus === dossier.status) return;
    setStatusChanging(true);
    try {
      const { error } = await supabase
        .from('dossiers')
        .update({ status: newStatus })
        .eq('id', id!)
        .eq('user_id', user!.id);

      if (error) throw error;

      setDossier({ ...dossier, status: newStatus });
      toast({
        title: 'Estado atualizado',
        description: `Dossiê alterado para "${statusLabels[newStatus]}"`,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao alterar estado' });
    } finally {
      setStatusChanging(false);
    }
  }

  useEffect(() => {
    if (!user || !id) return;
    fetchAllData();
  }, [user, id]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          documents:documents(*)
        `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;

      setDossier(data);
      setDocuments((data.documents ?? []) as DocumentRow[]);

      const gaps: string[] = [];
      if (!data.documents?.length) gaps.push('Ausência de documentos.');
      setLacunas(gaps);
    } catch {
      setError('Erro ao carregar dossiê.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDocument(data: DocForm) {
    if (dossier?.status === 'arquivado') return;

    try {
      const { error } = await supabase.from('documents').insert({
        dossier_id: id!,
        user_id: user!.id,
        title: data.title,
        document_type: data.document_type,
        document_date: data.document_date || null,
        entity: data.entity || null,
        description: data.description || null,
      });

      if (error) throw error;

      toast({ title: 'Documento adicionado' });
      docForm.reset();
      fetchAllData();
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao adicionar documento' });
    }
  }

  if (loading) return <DashboardLayout><Loader2 className="animate-spin" /></DashboardLayout>;
  if (error) return <DashboardLayout><Alert variant="destructive"><AlertTriangle className="h-4 w-4" />{error}</Alert></DashboardLayout>;
  if (!dossier) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/dossiers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="text-xl font-bold">{dossier.title}</h1>

        <Select
          value={dossier.status}
          onValueChange={(val) => handleStatusChange(val as DossierStatus)}
          disabled={statusChanging}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            {statusChanging ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="completo">Completo</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handlePrintReport} variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Relatório Final
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(handleAddDocument)}
        className="space-y-4 mt-4"
      >
        <div>
          <Input {...register('title')} placeholder="Título do Documento" />
          {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Select
            defaultValue="outro"
            onValueChange={(val) => docForm.setValue('document_type', val as DocForm['document_type'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="imagem">Imagem</SelectItem>
              <SelectItem value="texto">Texto</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.document_type && <p className="text-destructive text-sm mt-1">{errors.document_type.message}</p>}
        </div>

        <div>
          <Input type="date" {...register('document_date')} />
        </div>

        <div>
          <Input {...register('entity')} placeholder="Entidade (opcional)" />
        </div>

        <div>
          <Textarea {...register('description')} placeholder="Descrição (opcional)" />
        </div>

        <Button type="submit" disabled={dossier.status === 'arquivado'}>Adicionar Documento</Button>
      </form>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Documentos Existentes</h2>
        <ol className="list-decimal ml-6">
          {documents.map(d => (
            <li key={d.id}>{formatDocReference(d)}</li>
          ))}
        </ol>
      </div>

      <div className="hidden print:block">
        <DossierReportView
          ref={reportRef}
          dossier={dossier}
          documents={documents}
          lacunas={lacunas}
        />
      </div>
    </DashboardLayout>
  );
}
