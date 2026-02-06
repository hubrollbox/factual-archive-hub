import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Edit2, Trash2, FileText } from 'lucide-react';

interface ChronologyEntry {
  id: string;
  dossier_id: string;
  event_date: string;
  title: string;
  description: string | null;
  source_reference: string | null;
  document_id: string | null;
  created_at: string;
  dossier?: {
    title: string;
  };
  document?: {
    title: string;
  } | null;
}

interface ChronologyEntryCardProps {
  entry: ChronologyEntry;
  onEdit: (entry: ChronologyEntry) => void;
  onDelete: (id: string) => void;
}

export function ChronologyEntryCard({ entry, onEdit, onDelete }: ChronologyEntryCardProps) {
  return (
    <div className="relative">
      <div className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                {new Date(entry.event_date).toLocaleDateString('pt-PT', {
                  day: 'numeric',
                  month: 'long',
                })}
              </CardDescription>
              <CardTitle className="text-base font-semibold mt-1 break-words">
                {entry.title}
              </CardTitle>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(entry)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entry.description && (
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {entry.dossier && (
              <span className="rounded bg-secondary px-2 py-0.5">
                {entry.dossier.title}
              </span>
            )}
            {entry.source_reference && (
              <span className="rounded bg-secondary px-2 py-0.5">
                Fonte: {entry.source_reference}
              </span>
            )}
            {entry.document && (
              <span className="rounded bg-primary/10 text-primary px-2 py-0.5 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {entry.document.title}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
