import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive as ArchiveIcon, Loader2, FolderOpen, FileText, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ArchivedDossier {
  id: string;
  title: string;
  client_name: string | null;
  reference_code: string | null;
  updated_at: string;
  document_count: number;
}

export default function Archive() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState<ArchivedDossier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedDossiers();
  }, [user]);

  async function fetchArchivedDossiers() {
    if (!user) return;

    try {
      const { data: dossiersData, error: dossiersError } = await supabase
        .from('dossiers')
        .select('id, title, client_name, reference_code, updated_at')
        .eq('user_id', user.id)
        .eq('status', 'arquivado')
        .order('updated_at', { ascending: false });

      if (dossiersError) throw dossiersError;

      // Fetch document counts
      const { data: documentsData } = await supabase
        .from('documents')
        .select('dossier_id')
        .eq('user_id', user.id);

      const archiveData: ArchivedDossier[] = (dossiersData || []).map((d) => ({
        ...d,
        document_count: documentsData?.filter(doc => doc.dossier_id === d.id).length || 0,
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
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Arquivo
          </h1>
          <p className="mt-1 text-muted-foreground">
            Dossiês arquivados e arquivo digital estruturado
          </p>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Arquivo Físico</CardTitle>
            <CardDescription>
              Esta área está preparada para futura integração com arquivo físico. 
              Por agora, todos os dossiês arquivados são geridos digitalmente.
            </CardDescription>
          </CardHeader>
        </Card>

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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {dossiers.length} dossiê{dossiers.length !== 1 ? 's' : ''} arquivado{dossiers.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dossiers.map((dossier) => (
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
                        <p className="text-sm text-muted-foreground">
                          {dossier.client_name}
                        </p>
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
