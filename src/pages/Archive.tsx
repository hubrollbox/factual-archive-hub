import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Archive as ArchiveIcon,
  Loader2,
  FolderOpen,
  FileText,
  Calendar,
  Search,
  ArchiveRestore,
  FolderOpenDot,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ArchivedDossier {
  id: string;
  title: string;
  client_name: string | null;
  reference_code: string | null;
  category: string | null;
  updated_at: string;
  document_count: number;
}

const CATEGORIES = [
  'Consumo',
  'Telecomunicações',
  'Trânsito',
  'Fiscal',
  'Trabalho',
  'Outros',
];

export default function Archive() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dossiers, setDossiers] = useState<ArchivedDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      setDossiers([]);
      setLoading(false);
      return;
    }
    fetchArchivedDossiers();
  }, [user]);

  async function fetchArchivedDossiers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, title, client_name, reference_code, updated_at, category, documents(count)')
        .eq('user_id', user!.id)
        .eq('status', 'arquivado')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const archiveData: ArchivedDossier[] = (data ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        client_name: d.client_name,
        reference_code: d.reference_code,
        category: d.category,
        updated_at: d.updated_at,
        document_count: d.documents?.[0]?.count ?? 0,
      }));

      setDossiers(archiveData);
    } catch (error) {
      console.error('Error fetching archived dossiers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnarchive(dossierId: string) {
    try {
      const { error } = await supabase
        .from('dossiers')
        .update({ status: 'em_analise' as const })
        .eq('id', dossierId)
        .eq('user_id', user!.id);

      if (error) throw error;

      setDossiers((prev) => prev.filter((d) => d.id !== dossierId));
      toast({ title: 'Dossiê restaurado', description: 'Estado alterado para "Em Análise".' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao desarquivar' });
    }
  }

  const filtered = useMemo(() => {
    let result = dossiers;

    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter(
        (d) => d.category?.toLowerCase() === categoryFilter.toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.client_name?.toLowerCase().includes(q) ?? false) ||
          (d.reference_code?.toLowerCase().includes(q) ?? false),
      );
    }

    return result;
  }, [dossiers, searchQuery, categoryFilter]);

  const totalDocuments = useMemo(
    () => dossiers.reduce((sum, d) => sum + d.document_count, 0),
    [dossiers],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Arquivo FactualHub
          </h1>
          <p className="mt-1 text-muted-foreground">
            Dossiês arquivados e estruturados para referência factual
          </p>
        </div>

        {/* Summary */}
        {!loading && dossiers.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              {dossiers.length} dossiê{dossiers.length !== 1 ? 's' : ''} arquivado{dossiers.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {totalDocuments} documento{totalDocuments !== 1 ? 's' : ''} no total
            </Badge>
          </div>
        )}

        {/* Search & Filters */}
        {!loading && dossiers.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por título, entidade ou referência..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading / Empty State / Dossiers */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : dossiers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ArchiveIcon className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Arquivo vazio</h3>
              <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
                Nenhum dossiê foi arquivado ainda. Para arquivar, abra um dossiê e altere o estado para "Arquivado".
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/dashboard/dossiers">
                  <FolderOpenDot className="mr-2 h-4 w-4" />
                  Ver Dossiês
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Sem resultados</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Nenhum dossiê corresponde aos filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dossier) => (
              <Card key={dossier.id} className="h-full transition-shadow hover:shadow-lg group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Arquivado
                    </Badge>
                  </div>
                  <Link to={`/dashboard/dossiers/${dossier.id}`}>
                    <CardTitle className="text-base font-semibold mt-2 line-clamp-1 hover:underline">
                      {dossier.title}
                    </CardTitle>
                  </Link>
                  {dossier.reference_code && (
                    <CardDescription className="text-xs">
                      Ref: {dossier.reference_code}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  {dossier.client_name && (
                    <p className="text-sm text-muted-foreground">{dossier.client_name}</p>
                  )}

                  {dossier.category && (
                    <Badge variant="outline" className="text-[0.65rem] mt-1">
                      {dossier.category}
                    </Badge>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {dossier.document_count} doc{dossier.document_count !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(dossier.updated_at).toLocaleDateString('pt-PT')}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUnarchive(dossier.id);
                    }}
                  >
                    <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
                    Restaurar dossiê
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
