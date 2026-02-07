import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive as ArchiveIcon, Loader2, FolderOpen, FileText, Calendar, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ArchivedDossier {
  id: string;
  title: string;
  client_name: string | null;
  reference_code: string | null;
  updated_at: string;
  document_count: number;
  type?: string;
  categories?: string[];
}

export default function Archive() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState<ArchivedDossier[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Fetch dossiers arquivados
      const { data: dossiersData, error: dossiersError } = await supabase
        .from('dossiers')
        .select('id, title, client_name, reference_code, updated_at, type, categories')
        .eq('user_id', user!.id)
        .eq('status', 'arquivado')
        .order('updated_at', { ascending: false });

      if (dossiersError) throw dossiersError;

      // Fetch document counts grouped by dossier
      const { data: documentsCountData, error: documentsError } = await supabase
        .from('documents')
        .select('dossier_id', { count: 'exact', head: false })
        .eq('user_id', user!.id)
        .group('dossier_id');

      if (documentsError) throw documentsError;

      const documentsCountMap = new Map<string, number>();
      documentsCountData?.forEach((doc: any) => {
        documentsCountMap.set(doc.dossier_id, doc.count ?? 0);
      });

      const archiveData: ArchivedDossier[] = (dossiersData || []).map(d => ({
        ...d,
        document_count: documentsCountMap.get(d.id) || 0,
      }));

      setDossiers(archiveData);
    } catch (error) {
      console.error('Error fetching archived dossiers:', error);
    } finally {
      setLoading(false);
    }
  }

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

        {/* Placeholder Arquivo Físico */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Arquivo Físico</CardTitle>
            <CardDescription>
              Área preparada para futura integração com arquivo físico. Atualmente, todos os dossiês são digitais.
            </CardDescription>
          </CardHeader>
        </Card>

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
              <p className="mt-1 text-sm text-muted-foreground">
                Nenhum dossiê foi arquivado ainda.
              </p>
              <p className="text-sm text-muted-foreground">
                Para arquivar um dossiê, altere o seu estado para "Arquivado".
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {dossiers.length} dossiê{dossiers.length !== 1 ? 's' : ''} arquivado{dossiers.length !== 1 ? 's' : ''}
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dossiers.map(dossier => (
                <Link key={dossier.id} to={`/dashboard/dossiers/${dossier.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-soft-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Arquivado
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-semibold mt-2 line-clamp-1">
                        {dossier.title}
                      </CardTitle>
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

                      {dossier.type && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Tag className="h-3 w-3" />
                          {dossier.type}
                        </div>
                      )}

                      {dossier.categories && dossier.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dossier.categories.map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="text-[0.65rem]">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {dossier.document_count} docs
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(dossier.updated_at).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}