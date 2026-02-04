import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Plus, Loader2, Trash2, Edit, Calendar } from 'lucide-react';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';
type DocumentType = 'pdf' | 'imagem' | 'texto' | 'outro';

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

interface Document {
  id: string;
  title: string;
  description: string | null;
  document_type: DocumentType;
  file_path: string | null;
  file_name: string | null;
  entity: string | null;
  document_date: string | null;
  created_at: string;
}

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const documentTypeLabels: Record<DocumentType, string> = {
  pdf: 'PDF',
  imagem: 'Imagem',
  texto: 'Texto',
  outro: 'Outro',
};

export default function DossierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [docFormData, setDocFormData] = useState({
    title: '',
    description: '',
    document_type: 'outro' as DocumentType,
    entity: '',
    document_date: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    client_name: '',
    reference_code: '',
    status: 'em_analise' as DossierStatus,
  });

  useEffect(() => {
    fetchDossier();
    fetchDocuments();
  }, [id, user]);

  async function fetchDossier() {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/dashboard/dossiers');
        return;
      }
      setDossier(data);
      setEditFormData({
        title: data.title,
        description: data.description || '',
        client_name: data.client_name || '',
        reference_code: data.reference_code || '',
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching dossier:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o dossiê.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments() {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('dossier_id', id)
        .eq('user_id', user.id)
        .order('document_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  async function handleUpdateDossier(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('dossiers')
        .update({
          title: editFormData.title,
          description: editFormData.description || null,
          client_name: editFormData.client_name || null,
          reference_code: editFormData.reference_code || null,
          status: editFormData.status,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Dossiê actualizado',
        description: 'As alterações foram guardadas.',
      });

      setIsEditMode(false);
      fetchDossier();
    } catch (error) {
      console.error('Error updating dossier:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível actualizar o dossiê.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('documents').insert({
        dossier_id: id,
        user_id: user.id,
        title: docFormData.title,
        description: docFormData.description || null,
        document_type: docFormData.document_type,
        entity: docFormData.entity || null,
        document_date: docFormData.document_date || null,
      });

      if (error) throw error;

      toast({
        title: 'Documento adicionado',
        description: 'O documento foi adicionado ao dossiê.',
      });

      setDocFormData({ title: '', description: '', document_type: 'outro', entity: '', document_date: '' });
      setIsDocDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o documento.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Documento eliminado',
        description: 'O documento foi removido do dossiê.',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível eliminar o documento.',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!dossier) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/dossiers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{dossier.title}</h1>
            {dossier.reference_code && (
              <p className="text-sm text-muted-foreground">Ref: {dossier.reference_code}</p>
            )}
          </div>
          <Badge variant="outline">{statusLabels[dossier.status]}</Badge>
          <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Informação</TabsTrigger>
            <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Dossiê</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dossier.client_name && (
                  <div>
                    <Label className="text-muted-foreground">Cliente</Label>
                    <p className="font-medium">{dossier.client_name}</p>
                  </div>
                )}
                {dossier.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p>{dossier.description}</p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Data de Criação</Label>
                    <p>{new Date(dossier.created_at).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Última Actualização</Label>
                    <p>{new Date(dossier.updated_at).toLocaleDateString('pt-PT')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Documento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Documento</DialogTitle>
                      <DialogDescription>Registe um novo documento neste dossiê</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddDocument} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc_title">Título *</Label>
                        <Input
                          id="doc_title"
                          value={docFormData.title}
                          onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="doc_type">Tipo</Label>
                          <Select
                            value={docFormData.document_type}
                            onValueChange={(v) => setDocFormData({ ...docFormData, document_type: v as DocumentType })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="imagem">Imagem</SelectItem>
                              <SelectItem value="texto">Texto</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doc_date">Data do Documento</Label>
                          <Input
                            id="doc_date"
                            type="date"
                            value={docFormData.document_date}
                            onChange={(e) => setDocFormData({ ...docFormData, document_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc_entity">Entidade</Label>
                        <Input
                          id="doc_entity"
                          value={docFormData.entity}
                          onChange={(e) => setDocFormData({ ...docFormData, entity: e.target.value })}
                          placeholder="Origem ou entidade do documento"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc_description">Descrição</Label>
                        <Textarea
                          id="doc_description"
                          value={docFormData.description}
                          onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDocDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Adicionar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {documents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 font-medium text-foreground">Sem documentos</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Adicione documentos a este dossiê.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{doc.title}</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {documentTypeLabels[doc.document_type]}
                            </Badge>
                            {doc.entity && (
                              <span className="text-xs text-muted-foreground">{doc.entity}</span>
                            )}
                            {doc.document_date && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(doc.document_date).toLocaleDateString('pt-PT')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Dossiê</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateDossier} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_title">Título *</Label>
                <Input
                  id="edit_title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_client">Cliente</Label>
                <Input
                  id="edit_client"
                  value={editFormData.client_name}
                  onChange={(e) => setEditFormData({ ...editFormData, client_name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_ref">Referência</Label>
                  <Input
                    id="edit_ref"
                    value={editFormData.reference_code}
                    onChange={(e) => setEditFormData({ ...editFormData, reference_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Estado</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(v) => setEditFormData({ ...editFormData, status: v as DossierStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="completo">Completo</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_description">Descrição</Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
