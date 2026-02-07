import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface DossierOption {
  id: string;
  title: string;
  status: DossierStatus;
  client_name: string | null;
  document_count: number;
  chronology_count: number;
}

interface DossierSelectorProps {
  dossiers: DossierOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

export function DossierSelector({ dossiers, selectedId, onSelect }: DossierSelectorProps) {
  const selected = dossiers.find((d) => d.id === selectedId);

  return (
    <div className="space-y-3">
      <Select value={selectedId ?? ''} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um dossiê para gerar relatórios..." />
        </SelectTrigger>
        <SelectContent>
          {dossiers.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.title}
              {d.client_name ? ` — ${d.client_name}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">{selected.title}</span>
          <Badge variant="outline">{statusLabels[selected.status]}</Badge>
          <span className="text-muted-foreground">
            {selected.document_count} documentos · {selected.chronology_count} entradas
          </span>
        </div>
      )}
    </div>
  );
}
