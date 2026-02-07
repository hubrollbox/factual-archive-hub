import { Link2, Unlink } from 'lucide-react';

interface Document {
  id: string;
  title: string;
}

interface ChronologyEntry {
  id: string;
  title: string;
  document_id: string | null;
}

export interface RelationsAnalysis {
  totalEntries: number;
  withDocument: number;
  withoutDocument: number;
  coveragePercent: number;
  unreferencedDocs: Document[];
}

export function analyzeRelations(
  docs: Document[],
  chronos: ChronologyEntry[]
): RelationsAnalysis {
  const withDoc = chronos.filter((c) => c.document_id);
  const withoutDoc = chronos.filter((c) => !c.document_id);

  const referencedDocIds = new Set(withDoc.map((c) => c.document_id));
  const unreferencedDocs = docs.filter((d) => !referencedDocIds.has(d.id));

  const coverage = chronos.length > 0
    ? Math.round((withDoc.length / chronos.length) * 100)
    : 0;

  return {
    totalEntries: chronos.length,
    withDocument: withDoc.length,
    withoutDocument: withoutDoc.length,
    coveragePercent: coverage,
    unreferencedDocs,
  };
}

interface RelationsReportListProps {
  analysis: RelationsAnalysis;
}

export function RelationsReportList({ analysis }: RelationsReportListProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 text-primary" />
        <span>
          <strong>{analysis.coveragePercent}%</strong> de cobertura documental
        </span>
      </div>
      <div className="text-muted-foreground">
        {analysis.withDocument} de {analysis.totalEntries} entradas ligadas a documentos
      </div>
      {analysis.unreferencedDocs.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Unlink className="h-3.5 w-3.5" />
            <span>{analysis.unreferencedDocs.length} documento(s) não referenciado(s):</span>
          </div>
          <ul className="ml-5 mt-1 list-disc text-muted-foreground">
            {analysis.unreferencedDocs.slice(0, 5).map((d) => (
              <li key={d.id}>{d.title}</li>
            ))}
            {analysis.unreferencedDocs.length > 5 && (
              <li>e mais {analysis.unreferencedDocs.length - 5}...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
