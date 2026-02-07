import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import {
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
  Download,
  ChevronDown,
  Link2,
  Activity,
  Table,
  RefreshCw,
  Printer,
} from 'lucide-react';

import { DossierSelector } from '@/components/reports/DossierSelector';
import { ReportBlock } from '@/components/reports/ReportBlock';
import { ReportsCharts } from '@/components/reports/ReportsCharts';
import { analyzeGaps, GapsReportList } from '@/components/reports/GapsReport';
import { analyzeInconsistencies, InconsistenciesList } from '@/components/reports/InconsistenciesReport';
import { analyzeRelations, RelationsReportList } from '@/components/reports/DocumentRelationsReport';
import { downloadCSV } from '@/components/reports/CsvExporter';
import { DossierReportPrintView } from '@/components/reports/ReportsPrintView';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  status: DossierStatus;
  category: string | null;
  client_name: string | null;
  description: string | null;
  updated_at: string;
  document_count: number;
  chronology_count: number;
  has_gaps: boolean;
}

interface Document {
  id: string;
  title: string;
  document_type: string;
  document_date: string | null;
  entity: string | null;
  description: string | null;
  created_at: string;
}

interface ChronologyEntry {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  document_id: string | null;
  source_reference: string | null;
}

export default function Reports() {
  const { user } = useAuth();

  // --- Data state ---
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [chronos, setChronos] = useState<ChronologyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Print state ---
  const [printMode, setPrintMode] = useState<'dossier' | 'chronology' | 'gaps' | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // --- Collapsible state ---
  const [techOpen, setTechOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const selectedDossier = useMemo(
    () => dossiers.find((d) => d.id === selectedDossierId) ?? null,
    [dossiers, selectedDossierId]
  );

  // Derived analysis
  const gaps = useMemo(() => {
    if (!selectedDossier) return [];
    return analyzeGaps(docs, chronos);
  }, [selectedDossier, docs, chronos]);

  const inconsistencies = useMemo(() => {
    if (!selectedDossier) return [];
    return analyzeInconsistencies(docs, chronos);
  }, [selectedDossier, docs, chronos]);

  const relations = useMemo(() => {
    if (!selectedDossier) return null;
    return analyzeRelations(docs, chronos);
  }, [selectedDossier, docs, chronos]);

  const gapCount = useMemo(
    () => gaps.filter((g) => g.type === 'warning').length,
    [gaps]
  );

  const inconsistencyCount = useMemo(
    () => inconsistencies.filter((i) => i.message !== 'Nenhuma inconsistência detetada').length,
    [inconsistencies]
  );

  // --- Load dossiers ---
  useEffect(() => {
    if (user) loadDossiers();
  }, [user]);

  async function loadDossiers() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('dossiers')
        .select(`
          id, title, status, category, client_name, description, updated_at,
          document_count:documents(count),
          chronology_count:chronology_entries(count)
        `)
        .eq('user_id', user!.id);

      if (fetchError) throw fetchError;

      const mapped: Dossier[] = (data || []).map((d: any) => {
        const docCount = d.document_count[0]?.count || 0;
        const chronoCount = d.chronology_count[0]?.count || 0;
        return {
          id: d.id,
          title: d.title,
          status: d.status,
          category: d.category,
          client_name: d.client_name,
          description: d.description,
          updated_at: d.updated_at,
          document_count: docCount,
          chronology_count: chronoCount,
          has_gaps: docCount === 0 || chronoCount === 0,
        };
      });
      setDossiers(mapped);
    } catch {
      setError('Erro ao carregar dossiês.');
    } finally {
      setLoading(false);
    }
  }

  // --- Load dossier detail ---
  const loadDossierDetail = useCallback(async (dossierId: string) => {
    setLoadingDetail(true);
    try {
      const [docsRes, chronosRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, title, document_type, document_date, entity, description, created_at')
          .eq('dossier_id', dossierId)
          .order('document_date', { ascending: true }),
        supabase
          .from('chronology_entries')
          .select('id, title, event_date, description, document_id, source_reference')
          .eq('dossier_id', dossierId)
          .order('event_date', { ascending: true }),
      ]);

      setDocs(docsRes.data || []);
      setChronos(chronosRes.data || []);
    } catch {
      // Silent fail - data will just be empty
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleDossierSelect = useCallback((id: string) => {
    setSelectedDossierId(id);
    loadDossierDetail(id);
  }, [loadDossierDetail]);

  // --- Print handlers ---
  const handlePrint = useCallback((mode: 'dossier' | 'chronology' | 'gaps') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 150);
    setTimeout(() => setPrintMode(null), 1000);
  }, []);

  // --- CSV handlers ---
  const handleCsvDocuments = useCallback(() => {
    if (!selectedDossier || docs.length === 0) return;
    const headers = ['Título', 'Tipo', 'Data', 'Entidade', 'Descrição'];
    const rows = docs.map((d) => [
      d.title,
      d.document_type,
      d.document_date || '',
      d.entity || '',
      d.description || '',
    ]);
    downloadCSV(headers, rows, `documentos_${selectedDossier.title}`);
  }, [selectedDossier, docs]);

  const handleCsvChronology = useCallback(() => {
    if (!selectedDossier || chronos.length === 0) return;
    const headers = ['Data', 'Título', 'Descrição', 'Fonte', 'Doc. Associado'];
    const rows = chronos.map((c) => [
      c.event_date,
      c.title,
      c.description || '',
      c.source_reference || '',
      c.document_id ? 'Sim' : 'Não',
    ]);
    downloadCSV(headers, rows, `cronologia_${selectedDossier.title}`);
  }, [selectedDossier, chronos]);

  const handleCsvDossier = useCallback(() => {
    if (!selectedDossier) return;
    const headers = ['Campo', 'Valor'];
    const rows = [
      ['Título', selectedDossier.title],
      ['Estado', selectedDossier.status],
      ['Categoria', selectedDossier.category || ''],
      ['Cliente', selectedDossier.client_name || ''],
      ['Documentos', String(selectedDossier.document_count)],
      ['Entradas Cronologia', String(selectedDossier.chronology_count)],
      ['Lacunas', selectedDossier.has_gaps ? 'Sim' : 'Não'],
    ];
    downloadCSV(headers, rows, `dossie_${selectedDossier.title}`);
  }, [selectedDossier]);

  const noDossierSelected = !selectedDossierId;

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
              Geração e exportação de relatórios por dossiê
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadDossiers} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
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
          <div className="space-y-8 print:hidden">
            {/* ============ BLOCO 1 — Relatórios Principais ============ */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Relatórios Principais
              </h2>

              <DossierSelector
                dossiers={dossiers}
                selectedId={selectedDossierId}
                onSelect={handleDossierSelect}
              />

              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <ReportBlock
                    icon={FileText}
                    title="Relatório do Dossiê"
                    description="Resumo completo com índice de documentos, estado e descrição."
                    badge={selectedDossier ? `${selectedDossier.document_count} docs` : undefined}
                    disabled={noDossierSelected}
                    actions={[
                      {
                        label: 'Gerar PDF',
                        icon: Printer,
                        onClick: () => handlePrint('dossier'),
                        disabled: noDossierSelected,
                      },
                    ]}
                  />

                  <ReportBlock
                    icon={Clock}
                    title="Cronologia Factual"
                    description="Timeline ordenada de todos os eventos do dossiê."
                    badge={selectedDossier ? `${selectedDossier.chronology_count} entradas` : undefined}
                    disabled={noDossierSelected}
                    actions={[
                      {
                        label: 'PDF',
                        icon: Printer,
                        onClick: () => handlePrint('chronology'),
                        disabled: noDossierSelected,
                      },
                      {
                        label: 'CSV',
                        icon: Download,
                        onClick: handleCsvChronology,
                        disabled: noDossierSelected || chronos.length === 0,
                        variant: 'secondary',
                      },
                    ]}
                  />

                  <ReportBlock
                    icon={AlertTriangle}
                    title="Relatório de Lacunas"
                    description="Identificação de documentação em falta ou incompleta."
                    badge={selectedDossier ? `${gapCount} lacuna(s)` : undefined}
                    badgeVariant={gapCount > 0 ? 'destructive' : 'secondary'}
                    disabled={noDossierSelected}
                    actions={[
                      {
                        label: 'Gerar PDF',
                        icon: Printer,
                        onClick: () => handlePrint('gaps'),
                        disabled: noDossierSelected,
                      },
                    ]}
                  >
                    {selectedDossier && <GapsReportList gaps={gaps} />}
                  </ReportBlock>
                </div>
              )}

              {noDossierSelected && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Selecione um dossiê acima para gerar relatórios.
                </p>
              )}
            </section>

            <Separator />

            {/* ============ BLOCO 2 — Relatórios Técnicos ============ */}
            <Collapsible open={techOpen} onOpenChange={setTechOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-md px-1 py-2 text-left transition-colors hover:bg-muted/50">
                  <h2 className="text-lg font-semibold text-foreground">
                    Relatórios Técnicos
                  </h2>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      techOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <ReportBlock
                    icon={AlertTriangle}
                    title="Inconsistências"
                    description="Datas fora de ordem, documentos sem data, fontes em falta."
                    badge={selectedDossier ? `${inconsistencyCount} alerta(s)` : undefined}
                    badgeVariant={inconsistencyCount > 0 ? 'destructive' : 'secondary'}
                    disabled={noDossierSelected}
                    actions={[]}
                  >
                    {selectedDossier && <InconsistenciesList issues={inconsistencies} />}
                  </ReportBlock>

                  <ReportBlock
                    icon={Link2}
                    title="Relações entre Documentos"
                    description="Cobertura documental das entradas de cronologia."
                    badge={relations ? `${relations.coveragePercent}%` : undefined}
                    disabled={noDossierSelected}
                    actions={[]}
                  >
                    {relations && <RelationsReportList analysis={relations} />}
                  </ReportBlock>

                  <ReportBlock
                    icon={Activity}
                    title="Atividade / Histórico"
                    description="Métricas do portfolio: distribuição por estado e categoria."
                    disabled={false}
                    actions={[]}
                  >
                    <ReportsCharts dossiers={dossiers} />
                  </ReportBlock>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* ============ BLOCO 3 — Exportações Brutas ============ */}
            <Collapsible open={exportOpen} onOpenChange={setExportOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-md px-1 py-2 text-left transition-colors hover:bg-muted/50">
                  <h2 className="text-lg font-semibold text-foreground">
                    Exportações Brutas
                  </h2>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      exportOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <ReportBlock
                    icon={Table}
                    title="CSV Documentos"
                    description="Exporta todos os documentos do dossiê como CSV."
                    badge={selectedDossier ? `${docs.length} registos` : undefined}
                    disabled={noDossierSelected}
                    actions={[
                      {
                        label: 'Descarregar',
                        icon: Download,
                        onClick: handleCsvDocuments,
                        disabled: noDossierSelected || docs.length === 0,
                      },
                    ]}
                  />

                  <ReportBlock
                    icon={Table}
                    title="CSV Cronologia"
                    description="Exporta as entradas cronológicas como CSV."
                    badge={selectedDossier ? `${chronos.length} registos` : undefined}
                    disabled={noDossierSelected}
                    actions={[
                      {
                        label: 'Descarregar',
                        icon: Download,
                        onClick: handleCsvChronology,
                        disabled: noDossierSelected || chronos.length === 0,
                      },
                    ]}
                  />

                  <ReportBlock
                    icon={Table}
                    title="CSV Dossiê"
                    description="Exporta os metadados do dossiê como CSV."
                    disabled={noDossierSelected}
                    actions={[
                      {
                        label: 'Descarregar',
                        icon: Download,
                        onClick: handleCsvDossier,
                        disabled: noDossierSelected,
                      },
                    ]}
                  />
                </div>

                {noDossierSelected && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Selecione um dossiê primeiro para exportar dados.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Print Views — hidden on screen, shown on print */}
      {printMode && selectedDossier && (
        <DossierReportPrintView
          ref={printRef}
          mode={printMode}
          dossier={selectedDossier}
          docs={docs}
          chronos={chronos}
          gaps={gaps}
        />
      )}
    </DashboardLayout>
  );
}
