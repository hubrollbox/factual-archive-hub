import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileBarChart, Loader2, AlertTriangle, CheckCircle2, FileText, FileDown, ArrowUpDown, RefreshCw, FileCheck } from 'lucide-react';
import { ReportsCharts } from '@/components/reports/ReportsCharts';
import { ReportsPrintView } from '@/components/reports/ReportsPrintView';
import { forwardRef } from 'react';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  status: DossierStatus;
  category: string | null;
  client_name: string | null;
  document_count: number;
  chronology_count: number;
  has_gaps: boolean;
  gaps_details?: string[];
}

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const categoryLabels: Record<string, string> = {
  consumo: 'Consumo',
  telecomunicacoes: 'Telecomunicações',
  transito: 'Trânsito',
  fiscal: 'Fiscal',
  trabalho: 'Trabalho',
  outros: 'Outros',
};

type SortOption = 'updated_at' | 'title' | 'document_count' | 'chronology_count';

// Componente para o Relatório Final (print view custom para single dossier)
const FinalReportView = forwardRef<HTMLDivElement, { dossier: Dossier; docs: any[]; chronos: any[]; lacunas: string[] }>(
  ({ dossier, docs, chronos, lacunas }, ref) => (
    <div ref={ref} className="p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">Relatório de Organização Documental e Apoio Factual - {dossier.title}</h1>
      <p className="mb-2">Data de Geração: {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
      <p className="mb-2">Método: Organização baseada em documentação fornecida pelo cliente e fontes abertas legítimas. Factos validados por datas, entidades e sequência.</p>
      <p className="mb-4 font-bold">Disclaimer: Este serviço é técnico e não jurídico. Não presta aconselhamento, interpretação da lei ou representação. A responsabilidade pela utilização jurídica é sempre do cliente ou do seu advogado.</p>

      <h2 className="text-xl font-semibold mb-2">Dossiê Documental Organizado</h2>
      {docs.length > 0 ? (
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">ID</th>
              <th className="border p-2 text-left">Nome</th>
              <th className="border p-2 text-left">Tipo</th>
              <th className="border p-2 text-left">Data</th>
              <th className="border p-2 text-left">Fonte/Path</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td className="border p-2">{doc.id}</td>
                <td className="border p-2">{doc.name}</td>
                <td className="border p-2">{doc.type || 'N/A'}</td>
                <td className="border p-2">{new Date(doc.created_at).toLocaleDateString('pt-PT')}</td>
                <td className="border p-2">{doc.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mb-4">Nenhum documento organizado.</p>
      )}

      <h2 className="text-xl font-semibold mb-2">Cronologia Factual Objetiva</h2>
      {chronos.length > 0 ? (
        <ul className="list-disc pl-5 mb-4">
          {chronos.map((chrono, index) => (
            <li key={index}>
              {new Date(chrono.date).toLocaleDateString('pt-PT')}: {chrono.description} (Fonte: {chrono.source || 'Fornecida'})
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4">Cronologia vazia.</p>
      )}

      <h2 className="text-xl font-semibold mb-2">Relatório de Lacunas Documentais</h2>
      {lacunas.length > 0 ? (
        <ul className="list-disc pl-5 mb-4">
          {lacunas.map((lacuna, index) => (
            <li key={index}>{lacuna}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-4">Nenhuma lacuna identificada.</p>
      )}

      <h2 className="text-xl font-semibold mb-2">Arquivo Organizado</h2>
      <p>Estruturado digitalmente (pastas indexadas). Manutenção periódica disponível por 6-12 meses, renovável sob pedido.</p>

      <p className="mt-4 text-sm italic">Cumprimento: RGPD e confidencialidade rigorosa. Fontes rastreáveis.</p>
    </div>
  )
);

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const finalPrintRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Relatórios de Dossiês',
  });
  const handleFinalPrint = useReactToPrint({
    content: () => finalPrintRef.current,
    documentTitle: 'Relatório Final de Dossiê',
  });
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [chronos, setChronos] = useState<any[]>([]);
  const [lacunas, setLacunas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user]);

  async function fetchReportData() {
    setLoading(true);
    setError(null);

    try {
      const { data: dossiersData, error: dossiersError } = await supabase
        .from('dossiers')
        .select(`
          id, title, status, client_name, category,
          document_count:documents(count),
          chronology_count:chronology_entries(count)
        `)
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });

      if (dossiersError) throw dossiersError;

      const reportData: Dossier[] = (dossiersData || []).map((d: any) => ({
        ...d,
        document_count: d.document_count[0]?.count || 0,
        chronology_count: d.chronology_count[0]?.count || 0,
        has_gaps: d.document_count[0]?.count === 0 || d.chronology_count[0]?.count === 0,
        gaps_details: [
          d.document_count[0]?.count === 0 ? 'Nenhum documento associado ao dossiê' : '',
          d.chronology_count[0]?.count === 0 ? 'Cronologia factual não iniciada' : ''
        ].filter(Boolean),
      }));

      setDossiers(reportData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function generateFinalReport(dossier: Dossier) {
    setLoading(true);
    setError(null);
    try {
      const { data: docsData } = await supabase
        .from('documents')
        .select('id, name, type, created_at, path')
        .eq('dossier_id', dossier.id)
        .order('created_at');

      const { data: chronosData } = await supabase
        .from('chronology_entries')
        .select('date, description, source')
        .eq('dossier_id', dossier.id)
        .order('date');

      const newLacunas = [];
      if (!docsData?.length) newLacunas.push('Ausência de documentos - sugerir recolha em fontes públicas legítimas (ex.: Portal das Finanças).');
      if (!chronosData?.length) newLacunas.push('Cronologia vazia - validar sequência factual com dados disponíveis.');

      setDocs(docsData || []);
      setChronos(chronosData || []);
      setLacunas(newLacunas);
      setSelectedDossier(dossier);

      // Aguarda um tick para o ref atualizar e imprime
      setTimeout(handleFinalPrint, 0);
    } catch (err) {
      console.error('Error generating final report:', err);
      setError('Ocorreu um erro ao gerar o relatório final.');
    } finally {
      setLoading(false);
    }
  }

  // Memoize filtered and sorted dossiers
  const filteredDossiers = useMemo(() => {
    let result = [...dossiers];

    if (filterStatus !== 'all') {
      if (filterStatus === 'with_gaps') {
        result = result.filter(d => d.has_gaps);
      } else {
        result = result.filter(d => d.status === filterStatus);
      }
    }

    if (filterCategory !== 'all') {
      result = result.filter(d => (d.category || 'outros') === filterCategory);
    }

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'document_count':
          return b.document_count - a.document_count;
        case 'chronology_count':
          return b.chronology_count - a.chronology_count;
        default:
          return 0; // Maintain original updated_at order
      }
    });
  }, [dossiers, filterStatus, filterCategory, sortBy]);

  // Memoize stats
  const stats = useMemo(() => ({
    total: dossiers.length,
    withGaps: dossiers.filter(d => d.has_gaps).length,
    complete: dossiers.filter(d => d.status === 'completo').length,
    pending: dossiers.filter(d => d.status === 'pendente' || d.status === 'em_analise').length,
  }), [dossiers]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
              Relatórios
            </h1>
            <p className="mt-1 text-muted-foreground">
              Listagem factual e identificação de lacunas documentais
            </p>
          </div>
          
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar PDF Geral</span>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="print:hidden">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={fetchReportData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary stats */}
        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Dossiês</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Com Lacunas</CardDescription>
                <CardTitle className="text-2xl text-warning">{stats.withGaps}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completos</CardDescription>
                <CardTitle className="text-2xl text-success">{stats.complete}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pendentes</CardDescription>
                <CardTitle className="text-2xl">{stats.pending}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Charts */}
        {!loading && !error && <ReportsCharts dossiers={dossiers} />}

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row print:hidden">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="with_gaps">Com lacunas</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="completo">Completo</SelectItem>
              <SelectItem value="arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="consumo">Consumo</SelectItem>
              <SelectItem value="telecomunicacoes">Telecomunicações</SelectItem>
              <SelectItem value="transito">Trânsito</SelectItem>
              <SelectItem value="fiscal">Fiscal</SelectItem>
              <SelectItem value="trabalho">Trabalho</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Mais recentes</SelectItem>
              <SelectItem value="title">Título (A-Z)</SelectItem>
              <SelectItem value="document_count">Mais documentos</SelectItem>
              <SelectItem value="chronology_count">Mais entradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report list */}
        {loading ? (
          <div className="flex items-center justify-center py-12 print:hidden">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? null : filteredDossiers.length === 0 ? (
          <Card className="print:hidden">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileBarChart className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Sem dados</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há dossiês correspondentes aos filtros.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 print:hidden">
            {filteredDossiers.map((dossier) => (
              <Card 
                key={dossier.id} 
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => navigate(`/dashboard/dossiers/${dossier.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">{dossier.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[dossier.status]}
                        </Badge>
                        {dossier.category && (
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[dossier.category] || dossier.category}
                          </Badge>
                        )}
                      </div>
                      {dossier.client_name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Cliente: {dossier.client_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{dossier.document_count} documentos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileBarChart className="h-4 w-4 text-muted-foreground" />
                        <span>{dossier.chronology_count} entradas</span>
                      </div>
                      {dossier.has_gaps ? (
                        <div className="flex items-center gap-2 text-sm text-warning">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Lacunas identificadas</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Documentação completa</span>
                        </div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1"
                        onClick={(e) => { e.stopPropagation(); generateFinalReport(dossier); }}
                      >
                        <FileCheck className="h-4 w-4" />
                        Relatório Final
                      </Button>
                    </div>
                  </div>
                  
                  {dossier.has_gaps && (
                    <div className="mt-4 rounded-md bg-warning/10 p-3 text-sm">
                      <p className="font-medium text-warning">Lacunas factuais identificadas:</p>
                      <ul className="mt-1 list-disc list-inside text-muted-foreground">
                        {dossier.gaps_details?.map((gap, index) => (
                          <li key={index}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Print View Geral */}
        <div className="hidden print:block">
          <ReportsPrintView ref={printRef} dossiers={filteredDossiers} stats={stats} />
        </div>

        {/* Print View para Relatório Final (escondido até chamado) */}
        {selectedDossier && (
          <div className="hidden">
            <FinalReportView ref={finalPrintRef} dossier={selectedDossier} docs={docs} chronos={chronos} lacunas={lacunas} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

