import { useEffect, useState, useRef, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
  FileBarChart,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileDown,
  ArrowUpDown,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

import { ReportsCharts } from '@/components/reports/ReportsCharts';
import { ReportsPrintView } from '@/components/reports/ReportsPrintView';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  status: DossierStatus;
  category: string | null;
  client_name: string | null;
  updated_at: string;
  document_count: number;
  chronology_count: number;
  has_gaps: boolean;
  gaps_details: string[];
}

type SortOption = 'updated_at' | 'title' | 'document_count' | 'chronology_count';

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const statusVariants: Record<DossierStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  em_analise: 'default',
  pendente: 'secondary',
  completo: 'outline',
  arquivado: 'destructive',
};

const categoryLabels: Record<string, string> = {
  consumo: 'Consumo',
  telecomunicacoes: 'Telecomunicações',
  transito: 'Trânsito',
  fiscal: 'Fiscal',
  trabalho: 'Trabalho',
  outros: 'Outros',
};

/* -------------------------------------------------------------------------- */
/*                              RELATÓRIO FINAL                               */
/* -------------------------------------------------------------------------- */

const FinalReportView = forwardRef<
  HTMLDivElement,
  { dossier: Dossier; docs: any[]; chronos: any[]; lacunas: string[] }
>(({ dossier, docs, chronos, lacunas }, ref) => (
  <div ref={ref} className="hidden print:block p-6 text-sm leading-relaxed">
    <h1 className="text-2xl font-bold mb-4">
      Relatório Final — {dossier.title}
    </h1>

    <p>Data de geração: {new Date().toLocaleDateString('pt-PT')}</p>

    <p className="mt-4 font-semibold">Natureza do serviço</p>
    <p>
      Este relatório resulta de um serviço técnico de organização documental e
      estruturação factual. Não constitui aconselhamento jurídico.
    </p>

    <h2 className="mt-6 font-semibold">1. Documentos Organizados</h2>
    {docs.length ? (
      <ul className="list-disc pl-6">
        {docs.map(d => (
          <li key={d.id}>
            {d.title} — {new Date(d.created_at).toLocaleDateString('pt-PT')}
          </li>
        ))}
      </ul>
    ) : (
      <p>Não existem documentos associados.</p>
    )}

    <h2 className="mt-6 font-semibold">2. Cronologia Factual</h2>
    {chronos.length ? (
      <ul className="list-disc pl-6">
        {chronos.map((c, i) => (
          <li key={i}>
            {new Date(c.event_date).toLocaleDateString('pt-PT')} — {c.title}
          </li>
        ))}
      </ul>
    ) : (
      <p>Cronologia não iniciada.</p>
    )}

    <h2 className="mt-6 font-semibold">3. Lacunas Identificadas</h2>
    {lacunas.length ? (
      <ul className="list-disc pl-6">
        {lacunas.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    ) : (
      <p>Não foram identificadas lacunas factuais.</p>
    )}

    <p className="mt-8 text-xs italic">
      Relatório fechado à data de geração. Alterações posteriores ao dossiê não
      se refletem neste documento.
    </p>
  </div>
));
FinalReportView.displayName = 'FinalReportView';

/* -------------------------------------------------------------------------- */
/*                                  PÁGINA                                    */
/* -------------------------------------------------------------------------- */

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const printRef = useRef<HTMLDivElement>(null);
  const finalPrintRef = useRef<HTMLDivElement>(null);

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [chronos, setChronos] = useState<any[]>([]);
  const [lacunas, setLacunas] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          title,
          status,
          category,
          client_name,
          updated_at,
          document_count:documents(count),
          chronology_count:chronology_entries(count)
        `)
        .eq('user_id', user!.id);

      if (error) throw error;

      const mapped: Dossier[] = (data || []).map((d: any) => {
        const docCount = d.document_count[0]?.count || 0;
        const chronoCount = d.chronology_count[0]?.count || 0;

        return {
          id: d.id,
          title: d.title,
          status: d.status,
          category: d.category,
          client_name: d.client_name,
          updated_at: d.updated_at,
          document_count: docCount,
          chronology_count: chronoCount,
          has_gaps: docCount === 0 || chronoCount === 0,
          gaps_details: [
            docCount === 0 && 'Sem documentos associados',
            chronoCount === 0 && 'Cronologia não iniciada',
          ].filter(Boolean) as string[],
        };
      });

      setDossiers(mapped);
    } catch {
      setError('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }

  async function generateFinalReport(dossier: Dossier) {
    const { data: fetchedDocs } = await supabase
      .from('documents')
      .select('*')
      .eq('dossier_id', dossier.id)
      .order('created_at');

    const { data: fetchedChronos } = await supabase
      .from('chronology_entries')
      .select('*')
      .eq('dossier_id', dossier.id)
      .order('event_date');

    const gaps: string[] = [];
    if (!fetchedDocs?.length) gaps.push('Documentação inexistente');
    if (!fetchedChronos?.length) gaps.push('Cronologia inexistente');

    setSelectedDossier(dossier);
    setDocs(fetchedDocs || []);
    setChronos(fetchedChronos || []);
    setLacunas(gaps);

    setTimeout(() => window.print(), 100);
  }

  const filtered = useMemo(() => {
    let res = [...dossiers];

    if (filterStatus !== 'all') {
      res =
        filterStatus === 'with_gaps'
          ? res.filter(d => d.has_gaps)
          : res.filter(d => d.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      res = res.filter(d => (d.category || 'outros') === filterCategory);
    }

    return res.sort((a, b) => {
      if (sortBy === 'updated_at')
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'document_count') return b.document_count - a.document_count;
      if (sortBy === 'chronology_count') return b.chronology_count - a.chronology_count;
      return 0;
    });
  }, [dossiers, filterStatus, filterCategory, sortBy]);

  const stats = useMemo(() => ({
    total: dossiers.length,
    withGaps: dossiers.filter(d => d.has_gaps).length,
    complete: dossiers.filter(d => d.status === 'completo').length,
    pending: dossiers.filter(d => d.status === 'pendente').length,
  }), [dossiers]);

  /* ---------------------------------------------------------------------- */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
              Relatórios
            </h1>
            <p className="mt-1 text-muted-foreground">
              Visão geral e análise dos dossiês
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="print:hidden">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12 print:hidden">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Dossiês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileBarChart className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{stats.total}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Com Lacunas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{stats.withGaps}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Completos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">{stats.complete}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pendentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{stats.pending}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <ReportsCharts dossiers={dossiers} />

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row print:hidden">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="completo">Completo</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                  <SelectItem value="with_gaps">Com Lacunas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-48">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
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

            {/* Dossier List */}
            {filtered.length === 0 ? (
              <Card className="print:hidden">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileBarChart className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-medium text-foreground">Sem dossiês</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nenhum dossiê corresponde aos filtros selecionados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:hidden">
                {filtered.map((d) => (
                  <Card
                    key={d.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => navigate(`/dashboard/dossiers/${d.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-snug">{d.title}</CardTitle>
                        <Badge variant={statusVariants[d.status]}>
                          {statusLabels[d.status]}
                        </Badge>
                      </div>
                      {d.client_name && (
                        <CardDescription>{d.client_name}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{d.document_count} docs</span>
                        <span>{d.chronology_count} entradas</span>
                        <span className="text-xs">
                          {categoryLabels[d.category || 'outros'] || d.category}
                        </span>
                      </div>
                      {d.has_gaps && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{d.gaps_details.join(' · ')}</span>
                        </div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateFinalReport(d);
                          }}
                        >
                          <FileCheck className="h-3 w-3" />
                          Relatório Final
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Print Views */}
      <ReportsPrintView ref={printRef} dossiers={filtered} stats={stats} />

      {selectedDossier && (
        <FinalReportView
          ref={finalPrintRef}
          dossier={selectedDossier}
          docs={docs}
          chronos={chronos}
          lacunas={lacunas}
        />
      )}
    </DashboardLayout>
  );
}
