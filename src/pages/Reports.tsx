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
import { FileBarChart, Loader2, AlertTriangle, CheckCircle2, FileText, FileDown, ArrowUpDown, RefreshCw } from 'lucide-react';
import { ReportsCharts } from '@/components/reports/ReportsCharts';
import { ReportsPrintView } from '@/components/reports/ReportsPrintView';

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

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Relatórios de Dossiês',
  });
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
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
      }));

      setDossiers(reportData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
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
            <span className="hidden sm:inline">Exportar PDF</span>
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
                    
                    <div className="flex flex-wrap gap-4">
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
                    </div>
                  </div>
                  
                  {dossier.has_gaps && (
                    <div className="mt-4 rounded-md bg-warning/10 p-3 text-sm">
                      <p className="font-medium text-warning">Lacunas factuais identificadas:</p>
                      <ul className="mt-1 list-disc list-inside text-muted-foreground">
                        {dossier.document_count === 0 && (
                          <li>Nenhum documento associado ao dossiê</li>
                        )}
                        {dossier.chronology_count === 0 && (
                          <li>Cronologia factual não iniciada</li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Print View */}
        <div className="hidden print:block">
          <ReportsPrintView ref={printRef} dossiers={filteredDossiers} stats={stats} />
        </div>
      </div>
    </DashboardLayout>
  );
}