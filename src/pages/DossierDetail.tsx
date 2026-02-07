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
import { ArrowLeft, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';

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

interface DocumentISO {
  id: string;
  author: string;
  title: string;
  document_type: 'oficio' | 'email' | 'contrato' | 'fatura' | 'despacho' | 'relatorio' | 'outro';
  document_date: string;
  place: string | null;
  reference_code: string | null;
  notes: string | null;
  created_at: string;
}

/* ===================== LABELS ===================== */

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

/* ===================== ZOD SCHEMA DOCUMENTO ===================== */

const docSchema = z.object({
  author: z.string().min(2, 'Autor/Entidade obrigatório'),
  title: z.string().min(3, 'Título obrigatório'),
  document_type: z.enum([
    'oficio',
    'email',
    'contrato',
    'fatura',
    'despacho',
    'relatorio',
    'outro',
  ]),
  document_date: z
    .string()
    .refine(d => new Date(d) <= new Date(), 'Data não pode ser futura'),
  place: z.string().optional(),
  reference_code: z.string().optional(),
  notes: z.string().optional(),
});

type DocForm = z.infer<typeof docSchema>;

/* ===================== ISO 690 ===================== */

function formatISO690(doc: DocumentISO) {
  const parts: string[] = [];

  parts.push(doc.author.toUpperCase());
  parts.push(`${doc.title}.`);
  parts.push(`[${doc.document_type}].`);

  if (doc.place) parts.push(`${doc.place},`);
  parts.push(`${new Date(doc.document_date).getFullYear()}.`);

  if (doc.reference_code) parts.push(`Ref. ${doc.reference_code}.`);
  if (doc.notes) parts.push(doc.notes);

  return parts.join(' ');
}

/* ===================== RELATÓRIO ===================== */

const DossierReportView = forwardRef<
  HTMLDivElement,
  { dossier: Dossier; documents: DocumentISO[]; lacunas: string[] }
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
        .sort((a, b) => a.document_date.localeCompare(b.document_date))
        .map(d => (
          <li key={d.id} className="mb-1">
            {formatISO690(d)}
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
  const [documents, setDocuments] = useState<DocumentISO[]>([]);
  const [lacunas, setLacunas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);

  const docForm = useForm<DocForm>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      author: '',
      title: '',
      document_type: 'outro',
      document_date: '',
      place: '',
      reference_code: '',
      notes: '',
    },
  });

  const { register, handleSubmit, formState: { errors } } = docForm;

  const handlePrintReport = useReactToPrint({
    content: () => reportRef.current,
  });

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
      setDocuments(data.documents ?? []);

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
        dossier_id: id,
        user_id: user!.id,
        author: data.author,
        title: data.title,
        document_type: data.document_type,
        document_date: data.document_date,
        place: data.place || null,
        reference_code: data.reference_code || null,
        notes: data.notes || null,
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
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard/dossiers')}>
          <ArrowLeft />
        </Button>

        <h1 className="text-xl font-bold">{dossier.title}</h1>
        <Badge>{statusLabels[dossier.status]}</Badge>

        <Button onClick={handlePrintReport}>
          <FileText className="mr-2 h-4 w-4" />
          Relatório Final
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(handleAddDocument)}
        className="space-y-4 mt-4"
      >
        <div>
          <Input {...register('author')} placeholder="Autor / Entidade" />
          {errors.author && <p className="text-red-600 text-sm mt-1">{errors.author.message}</p>}
        </div>

        <div>
          <Input {...register('title')} placeholder="Título do Documento" />
          {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Select {...register('document_type')}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oficio">Ofício</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="contrato">Contrato</SelectItem>
              <SelectItem value="fatura">Fatura</SelectItem>
              <SelectItem value="despacho">Despacho</SelectItem>
              <SelectItem value="relatorio">Relatório</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.document_type && <p className="text-red-600 text-sm mt-1">{errors.document_type.message}</p>}
        </div>

        <div>
          <Input type="date" {...register('document_date')} />
          {errors.document_date && <p className="text-red-600 text-sm mt-1">{errors.document_date.message}</p>}
        </div>

        <div>
          <Input {...register('place')} placeholder="Local (opcional)" />
        </div>

        <div>
          <Input {...register('reference_code')} placeholder="Referência (opcional)" />
        </div>

        <div>
          <Textarea {...register('notes')} placeholder="Notas (opcional)" />
        </div>

        <Button type="submit" disabled={dossier.status === 'arquivado'}>Adicionar Documento</Button>
      </form>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Documentos Existentes</h2>
        <ol className="list-decimal ml-6">
          {documents.map(d => (
            <li key={d.id}>{formatISO690(d)}</li>
          ))}
        </ol>
      </div>

      <div className="hidden">
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