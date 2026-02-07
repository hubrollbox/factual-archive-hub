import { forwardRef } from 'react';
import type { GapItem } from './GapsReport';

type DossierStatus = 'em_analise' | 'pendente' | 'completo' | 'arquivado';

interface Dossier {
  id: string;
  title: string;
  status: DossierStatus;
  category: string | null;
  client_name: string | null;
  description: string | null;
  document_count: number;
  chronology_count: number;
  has_gaps: boolean;
}

interface Document {
  id: string;
  title: string;
  document_type: string;
  document_date: string | null;
  entity: string | null;
  description: string | null;
  created_at: string;
}

interface ChronologyEntry {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  document_id: string | null;
  source_reference: string | null;
}

interface DossierReportPrintViewProps {
  mode: 'dossier' | 'chronology' | 'gaps';
  dossier: Dossier;
  docs: Document[];
  chronos: ChronologyEntry[];
  gaps: GapItem[];
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

const dateFormat = (date: string | null) =>
  date
    ? new Date(date).toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Sem data';

export const DossierReportPrintView = forwardRef<HTMLDivElement, DossierReportPrintViewProps>(
  ({ mode, dossier, docs, chronos, gaps }, ref) => {
    return (
      <div ref={ref} className="hidden print:block p-8 bg-white text-black text-sm leading-relaxed">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {mode === 'dossier' && `Relatório do Dossiê — ${dossier.title}`}
            {mode === 'chronology' && `Cronologia Factual — ${dossier.title}`}
            {mode === 'gaps' && `Relatório de Lacunas — ${dossier.title}`}
          </h1>
          <p className="text-gray-600 mt-1">
            Gerado em {dateFormat(new Date().toISOString())}
          </p>
        </div>

        {/* ======= DOSSIER REPORT ======= */}
        {mode === 'dossier' && (
          <>
            <section className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">Dados do Dossiê</h2>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium w-1/3">Título</td>
                    <td className="py-2">{dossier.title}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Estado</td>
                    <td className="py-2">{statusLabels[dossier.status]}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Categoria</td>
                    <td className="py-2">{categoryLabels[dossier.category || 'outros']}</td>
                  </tr>
                  {dossier.client_name && (
                    <tr className="border-b">
                      <td className="py-2 font-medium">Cliente</td>
                      <td className="py-2">{dossier.client_name}</td>
                    </tr>
                  )}
                  {dossier.description && (
                    <tr className="border-b">
                      <td className="py-2 font-medium">Descrição</td>
                      <td className="py-2">{dossier.description}</td>
                    </tr>
                  )}
                  <tr className="border-b">
                    <td className="py-2 font-medium">Total Documentos</td>
                    <td className="py-2">{dossier.document_count}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Total Entradas Cronologia</td>
                    <td className="py-2">{dossier.chronology_count}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">Índice de Documentos</h2>
              {docs.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Título</th>
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Data</th>
                      <th className="text-left py-2">Entidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr key={d.id} className="border-b">
                        <td className="py-1.5">{d.title}</td>
                        <td className="py-1.5">{d.document_type}</td>
                        <td className="py-1.5">{dateFormat(d.document_date)}</td>
                        <td className="py-1.5">{d.entity || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">Nenhum documento associado.</p>
              )}
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">Cronologia Factual</h2>
              {chronos.length > 0 ? (
                <ul className="space-y-1">
                  {chronos.map((c) => (
                    <li key={c.id}>
                      <strong>{dateFormat(c.event_date)}</strong> — {c.title}
                      {c.description && <span className="text-gray-600"> ({c.description})</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Cronologia não iniciada.</p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">Lacunas Identificadas</h2>
              <ul className="space-y-1">
                {gaps.map((g, i) => (
                  <li key={i}>
                    {g.type === 'warning' ? '⚠️' : '—'} {g.message}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* ======= CHRONOLOGY REPORT ======= */}
        {mode === 'chronology' && (
          <section>
            {chronos.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 w-1/5">Data</th>
                    <th className="text-left py-2">Evento</th>
                    <th className="text-left py-2 w-1/4">Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {chronos.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="py-1.5">{dateFormat(c.event_date)}</td>
                      <td className="py-1.5">
                        <strong>{c.title}</strong>
                        {c.description && (
                          <span className="block text-gray-600">{c.description}</span>
                        )}
                      </td>
                      <td className="py-1.5 text-gray-600">{c.source_reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">Cronologia não iniciada.</p>
            )}
          </section>
        )}

        {/* ======= GAPS REPORT ======= */}
        {mode === 'gaps' && (
          <section>
            <div className="mb-4 text-gray-700">
              Dossiê com <strong>{dossier.document_count}</strong> documento(s) e{' '}
              <strong>{dossier.chronology_count}</strong> entrada(s) de cronologia.
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 w-16">Tipo</th>
                  <th className="text-left py-2">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1.5">{g.type === 'warning' ? '⚠️' : 'ℹ️'}</td>
                    <td className="py-1.5">{g.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>Factual Archive Hub — Sistema de Gestão Documental</p>
          <p className="mt-1">
            Este relatório resulta de um serviço técnico de organização documental.
            Não constitui aconselhamento jurídico.
          </p>
        </div>
      </div>
    );
  }
);

DossierReportPrintView.displayName = 'DossierReportPrintView';
