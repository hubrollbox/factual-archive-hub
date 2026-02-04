import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileBarChart, Loader2, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  status: DossierStatus;
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

export default function Reports() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchReportData();
  }, [user]);

  async function fetchReportData() {
    if (!user) return;

    try {
      // Fetch dossiers with document and chronology counts
      const { data: dossiersData, error: dossiersError } = await supabase
        .from('dossiers')
        .select('id, title, status, client_name')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (dossiersError) throw dossiersError;

      // Fetch document counts
      const { data: documentsData } = await supabase
        .from('documents')
        .select('dossier_id')
        .eq('user_id', user.id);

      // Fetch chronology counts
      const { data: chronologyData } = await supabase
        .from('chronology_entries')
        .select('dossier_id')
        .eq('user_id', user.id);

      // Build report data
      const reportData: Dossier[] = (dossiersData || []).map((d) => {
        const docCount = documentsData?.filter(doc => doc.dossier_id === d.id).length || 0;
        const chronoCount = chronologyData?.filter(c => c.dossier_id === d.id).length || 0;
        
        return {
          ...d,
          document_count: docCount,
          chronology_count: chronoCount,
          has_gaps: docCount === 0 || chronoCount === 0,
        };
      });

      setDossiers(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDossiers = filterStatus === 'all'
    ? dossiers
    : filterStatus === 'with_gaps'
    ? dossiers.filter(d => d.has_gaps)
    : dossiers.filter(d => d.status === filterStatus);

  const stats = {
    total: dossiers.length,
    withGaps: dossiers.filter(d => d.has_gaps).length,
    complete: dossiers.filter(d => d.status === 'completo').length,
    pending: dossiers.filter(d => d.status === 'pendente' || d.status === 'em_analise').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Relatórios
          </h1>
          <p className="mt-1 text-muted-foreground">
            Listagem factual e identificação de lacunas documentais
          </p>
        </div>

        {/* Summary stats */}
        {!loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Filter */}
        <div className="flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os dossiês</SelectItem>
              <SelectItem value="with_gaps">Com lacunas</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="completo">Completo</SelectItem>
              <SelectItem value="arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDossiers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileBarChart className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Sem dados</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há dossiês correspondentes aos filtros.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDossiers.map((dossier) => (
              <Card key={dossier.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{dossier.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[dossier.status]}
                        </Badge>
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
                      <p className="font-medium text-warning">Lacunas detectadas:</p>
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
      </div>
    </DashboardLayout>
  );
}
