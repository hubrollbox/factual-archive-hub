import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Clock, FileText, Wallet, ArrowRight, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalDossiers: number;
  activeDossiers: number;
  totalDocuments: number;
  pendingReview: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      try {
        const [dossiersRes, documentsRes] = await Promise.all([
          supabase
            .from('dossiers')
            .select('id, status')
            .eq('user_id', user.id),
          supabase
            .from('documents')
            .select('id')
            .eq('user_id', user.id),
        ]);

        const dossiers = dossiersRes.data || [];
        const documents = documentsRes.data || [];

        setStats({
          totalDossiers: dossiers.length,
          activeDossiers: dossiers.filter(d => d.status !== 'arquivado').length,
          totalDocuments: documents.length,
          pendingReview: dossiers.filter(d => d.status === 'pendente' || d.status === 'em_analise').length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const quickLinks = [
    { href: '/dashboard/dossiers', label: 'Dossiês', icon: FolderOpen, description: 'Gerir dossiês e documentos' },
    { href: '/dashboard/cronologia', label: 'Cronologia', icon: Clock, description: 'Linhas temporais factuais' },
    { href: '/dashboard/relatorios', label: 'Relatórios', icon: FileText, description: 'Listagens e lacunas' },
    { href: '/dashboard/tesouraria', label: 'Tesouraria', icon: Wallet, description: 'Finanças pessoais' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral da sua área de trabalho
          </p>
        </div>

        {/* Stats cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Dossiês</CardDescription>
                <CardTitle className="text-3xl">{stats?.totalDossiers || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Dossiês Activos</CardDescription>
                <CardTitle className="text-3xl">{stats?.activeDossiers || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Documentos</CardDescription>
                <CardTitle className="text-3xl">{stats?.totalDocuments || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pendentes</CardDescription>
                <CardTitle className="text-3xl">{stats?.pendingReview || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Quick links */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Acesso Rápido</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Card className="transition-shadow hover:shadow-soft-lg">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{link.label}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
