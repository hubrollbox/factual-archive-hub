import { AlertTriangle } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  document_date: string | null;
}

interface ChronologyEntry {
  id: string;
  title: string;
  event_date: string;
  document_id: string | null;
  source_reference: string | null;
}

export interface Inconsistency {
  type: 'error' | 'warning';
  message: string;
}

export function analyzeInconsistencies(
  docs: Document[],
  chronos: ChronologyEntry[]
): Inconsistency[] {
  const issues: Inconsistency[] = [];

  // Entries without source
  const noSource = chronos.filter((c) => !c.source_reference);
  if (noSource.length > 0) {
    issues.push({
      type: 'warning',
      message: `${noSource.length} entrada(s) sem fonte de referência`,
    });
  }

  // Documents without date
  const noDate = docs.filter((d) => !d.document_date);
  if (noDate.length > 0) {
    issues.push({
      type: 'warning',
      message: `${noDate.length} documento(s) sem data definida`,
    });
  }

  // Entries without document link
  const noDoc = chronos.filter((c) => !c.document_id);
  if (noDoc.length > 0) {
    issues.push({
      type: 'warning',
      message: `${noDoc.length} entrada(s) sem ligação a documento`,
    });
  }

  // Chronological order check
  const sorted = [...chronos].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  let outOfOrder = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].event_date < sorted[i - 1].event_date) {
      outOfOrder++;
    }
  }
  if (outOfOrder > 0) {
    issues.push({
      type: 'error',
      message: `${outOfOrder} inconsistência(s) na ordem cronológica`,
    });
  }

  if (issues.length === 0) {
    issues.push({ type: 'warning', message: 'Nenhuma inconsistência detetada' });
  }

  return issues;
}

interface InconsistenciesListProps {
  issues: Inconsistency[];
}

export function InconsistenciesList({ issues }: InconsistenciesListProps) {
  return (
    <ul className="space-y-1.5 text-sm">
      {issues.map((issue, i) => (
        <li key={i} className="flex items-start gap-2">
          <AlertTriangle
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
              issue.type === 'error' ? 'text-destructive' : 'text-yellow-500'
            }`}
          />
          <span className="text-foreground">{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}
