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

export interface GapItem {
  type: 'warning' | 'info';
  message: string;
}

export function analyzeGaps(
  docs: Document[],
  chronos: ChronologyEntry[]
): GapItem[] {
  const gaps: GapItem[] = [];

  if (docs.length === 0) {
    gaps.push({ type: 'warning', message: 'Nenhum documento associado ao dossiê' });
  }

  if (chronos.length === 0) {
    gaps.push({ type: 'warning', message: 'Cronologia factual não iniciada' });
  }

  const docsWithoutDate = docs.filter((d) => !d.document_date);
  if (docsWithoutDate.length > 0) {
    gaps.push({
      type: 'warning',
      message: `${docsWithoutDate.length} documento(s) sem data definida`,
    });
  }

  const chronosWithoutSource = chronos.filter((c) => !c.source_reference);
  if (chronosWithoutSource.length > 0) {
    gaps.push({
      type: 'info',
      message: `${chronosWithoutSource.length} entrada(s) de cronologia sem fonte indicada`,
    });
  }

  const chronosWithoutDoc = chronos.filter((c) => !c.document_id);
  if (chronosWithoutDoc.length > 0) {
    gaps.push({
      type: 'info',
      message: `${chronosWithoutDoc.length} entrada(s) de cronologia sem documento associado`,
    });
  }

  if (gaps.length === 0) {
    gaps.push({ type: 'info', message: 'Não foram identificadas lacunas documentais' });
  }

  return gaps;
}

interface GapsReportListProps {
  gaps: GapItem[];
}

export function GapsReportList({ gaps }: GapsReportListProps) {
  return (
    <ul className="space-y-1.5 text-sm">
      {gaps.map((gap, i) => (
        <li key={i} className="flex items-start gap-2">
          {gap.type === 'warning' ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
          ) : (
            <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-center text-muted-foreground">—</span>
          )}
          <span className={gap.type === 'warning' ? 'text-foreground' : 'text-muted-foreground'}>
            {gap.message}
          </span>
        </li>
      ))}
    </ul>
  );
}
