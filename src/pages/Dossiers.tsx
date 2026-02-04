import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, FolderOpen, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  reference_code: string | null;
  status: DossierStatus;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const statusColors: Record<DossierStatus, string> = {
  em_analise: 'bg-warning/10 text-warning border-warning/20',
  pendente: 'bg-muted text-muted-foreground border-border',
  completo: 'bg-success/10 text-success border-success/20',
  arquivado: 'bg-secondary text-secondary-foreground border-border',
};

export default function Dossiers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_name: '',
    reference_code: '',
  });

  useEffect(() => {
    fetchDossiers();
  }, [user]);

  async function fetchDossiers() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDossiers(data || []);
    } catch (error) {
      console.error('Error fetching dossiers:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dossiês.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDossier(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('dossiers').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        client_name: formData.client_name || null,
        reference_code: formData.reference_code || null,
      });

      if (error) throw error;

      toast({
        title: 'Dossiê criado',
        description: 'O dossiê foi criado com sucesso.',
      });

      setFormData({ title: '', description: '', client_name: '', reference_code: '' });
      setIsDialogOpen(false);
      fetchDossiers();
    } catch (error) {
      console.error('Error creating dossier:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o dossiê.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesSearch =
      dossier.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.reference_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || dossier.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
              Dossiês
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gestão de dossiês e documentação
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Dossiê
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Dossiê</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo dossiê
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDossier} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nome do dossiê"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Nome do cliente (opcional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_code">Código de Referência</Label>
                  <Input
                    id="reference_code"
                    value={formData.reference_code}
                    onChange={(e) => setFormData({ ...formData, reference_code: e.target.value })}
                    placeholder="Ex: DOS-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do dossiê"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Dossiê
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar dossiês..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
            </SelectContent>
          </Select>
        </div>

        {/* Dossiers list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDossiers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Nenhum dossiê encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dossiers.length === 0
                  ? 'Crie o seu primeiro dossiê para começar.'
                  : 'Ajuste os filtros ou pesquisa.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDossiers.map((dossier) => (
              <Link key={dossier.id} to={`/dashboard/dossiers/${dossier.id}`}>
                <Card className="h-full transition-shadow hover:shadow-soft-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold line-clamp-1">
                        {dossier.title}
                      </CardTitle>
                      <Badge variant="outline" className={statusColors[dossier.status]}>
                        {statusLabels[dossier.status]}
                      </Badge>
                    </div>
                    {dossier.reference_code && (
                      <CardDescription className="text-xs">
                        Ref: {dossier.reference_code}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {dossier.client_name && (
                      <p className="text-sm text-muted-foreground">
                        Cliente: {dossier.client_name}
                      </p>
                    )}
                    {dossier.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {dossier.description}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Actualizado: {new Date(dossier.updated_at).toLocaleDateString('pt-PT')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
