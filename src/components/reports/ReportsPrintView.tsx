import { forwardRef } from 'react';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  status: DossierStatus;
  category: string | null;
  client_name: string | null;
  document_count: number;
  chronology_count: number;
  has_gaps: boolean;
}

interface Stats {
  total: number;
  withGaps: number;
  complete: number;
  pending: number;
}

interface ReportsPrintViewProps {
  dossiers: Dossier[];
  stats: Stats;
}

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const categoryLabels: Record<string, string> = {
  consumo: 'Consumo',
  telecomunicacoes: 'Telecomunicações',
  transito: 'Trânsito',
  fiscal: 'Fiscal',
  trabalho: 'Trabalho',
  outros: 'Outros',
};

export const ReportsPrintView = forwardRef<HTMLDivElement, ReportsPrintViewProps>(
  ({ dossiers, stats }, ref) => {
    const dossiersWithGaps = dossiers.filter((d) => d.has_gaps);

    return (
      <div ref={ref} className="hidden print:block p-8 bg-white text-black">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Relatório de Dossiês</h1>
          <p className="text-sm text-gray-600">
            Gerado em {new Date().toLocaleDateString('pt-PT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Resumo</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withGaps}</p>
              <p className="text-sm text-gray-600">Com Lacunas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.complete}</p>
              <p className="text-sm text-gray-600">Completos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        {/* Full Dossier List */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Lista de Dossiês</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Título</th>
                <th className="text-left py-2">Categoria</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-center py-2">Docs</th>
                <th className="text-center py-2">Entradas</th>
                <th className="text-center py-2">Lacunas</th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="py-2">{d.title}</td>
                  <td className="py-2">{categoryLabels[d.category || 'outros'] || d.category}</td>
                  <td className="py-2">{statusLabels[d.status]}</td>
                  <td className="text-center py-2">{d.document_count}</td>
                  <td className="text-center py-2">{d.chronology_count}</td>
                  <td className="text-center py-2">{d.has_gaps ? '⚠️' : '✓'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gaps Section */}
        {dossiersWithGaps.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Lacunas Identificadas</h2>
            <ul className="space-y-2">
              {dossiersWithGaps.map((d) => (
                <li key={d.id} className="text-sm">
                  <strong>{d.title}:</strong>
                  <ul className="ml-4 list-disc">
                    {d.document_count === 0 && <li>Nenhum documento associado</li>}
                    {d.chronology_count === 0 && <li>Cronologia factual não iniciada</li>}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>Factual Archive Hub - Sistema de Gestão Documental</p>
        </div>
      </div>
    );
  }
);

ReportsPrintView.displayName = 'ReportsPrintView';
