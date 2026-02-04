import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wallet, Loader2, TrendingUp, TrendingDown, Trash2, Calendar } from 'lucide-react';

type TreasuryType = 'receita' | 'despesa';

interface TreasuryEntry {
  id: string;
  entry_type: TreasuryType;
  amount: number;
  description: string;
  category: string | null;
  entry_date: string;
  created_at: string;
}

export default function Treasury() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TreasuryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const [formData, setFormData] = useState({
    entry_type: 'despesa' as TreasuryType,
    amount: '',
    description: '',
    category: '',
    entry_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchEntries();
  }, [user]);

  async function fetchEntries() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('treasury_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os registos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('treasury_entries').insert({
        user_id: user.id,
        entry_type: formData.entry_type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category || null,
        entry_date: formData.entry_date,
      });

      if (error) throw error;

      toast({
        title: 'Registo criado',
        description: 'O movimento foi registado com sucesso.',
      });

      setFormData({
        entry_type: 'despesa',
        amount: '',
        description: '',
        category: '',
        entry_date: new Date().toISOString().split('T')[0],
      });
      setIsDialogOpen(false);
      fetchEntries();
    } catch (error) {
      console.error('Error creating entry:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o registo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('treasury_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Registo eliminado',
        description: 'O movimento foi removido.',
      });

      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível eliminar o registo.',
        variant: 'destructive',
      });
    }
  }

  // Get unique months from entries
  const months = [...new Set(entries.map(e => e.entry_date.substring(0, 7)))].sort().reverse();

  const filteredEntries = entries.filter((entry) => {
    const matchesType = filterType === 'all' || entry.entry_type === filterType;
    const matchesMonth = filterMonth === 'all' || entry.entry_date.startsWith(filterMonth);
    return matchesType && matchesMonth;
  });

  // Calculate totals
  const totals = filteredEntries.reduce(
    (acc, entry) => {
      if (entry.entry_type === 'receita') {
        acc.receitas += entry.amount;
      } else {
        acc.despesas += entry.amount;
      }
      return acc;
    },
    { receitas: 0, despesas: 0 }
  );

  const saldo = totals.receitas - totals.despesas;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
              Tesouraria Pessoal
            </h1>
            <p className="mt-1 text-muted-foreground">
              Registo de despesas e receitas pessoais
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Registo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Movimento</DialogTitle>
                <DialogDescription>
                  Registe uma receita ou despesa pessoal
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entry_type">Tipo *</Label>
                    <Select
                      value={formData.entry_type}
                      onValueChange={(v) => setFormData({ ...formData, entry_type: v as TreasuryType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (€) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="entry_date">Data *</Label>
                    <Input
                      id="entry_date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Material, Transporte"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do movimento"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-success" />
                Receitas
              </CardDescription>
              <CardTitle className="text-2xl text-success">
                €{totals.receitas.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-destructive" />
                Despesas
              </CardDescription>
              <CardTitle className="text-2xl text-destructive">
                €{totals.despesas.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo</CardDescription>
              <CardTitle className={`text-2xl ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                €{saldo.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entries list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium text-foreground">Sem registos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione o seu primeiro movimento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
                    entry.entry_type === 'receita' ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    {entry.entry_type === 'receita' ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{entry.description}</h4>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.entry_date).toLocaleDateString('pt-PT')}
                      </span>
                      {entry.category && (
                        <span className="rounded bg-secondary px-2 py-0.5">{entry.category}</span>
                      )}
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    entry.entry_type === 'receita' ? 'text-success' : 'text-destructive'
                  }`}>
                    {entry.entry_type === 'receita' ? '+' : '-'}€{entry.amount.toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
