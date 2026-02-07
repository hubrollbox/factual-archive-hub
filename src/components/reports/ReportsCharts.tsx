import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface ReportsChartsProps {
  dossiers: Dossier[];
}

const statusLabels: Record<DossierStatus, string> = {
  em_analise: 'Em Análise',
  pendente: 'Pendente',
  completo: 'Completo',
  arquivado: 'Arquivado',
};

const statusColors: Record<DossierStatus, string> = {
  em_analise: 'hsl(var(--chart-1))',
  pendente: 'hsl(var(--chart-2))',
  completo: 'hsl(var(--chart-3))',
  arquivado: 'hsl(var(--chart-4))',
};

const categoryLabels: Record<string, string> = {
  consumo: 'Consumo',
  telecomunicacoes: 'Telecomunicações',
  transito: 'Trânsito',
  fiscal: 'Fiscal',
  trabalho: 'Trabalho',
  outros: 'Outros',
};

export function ReportsCharts({ dossiers }: ReportsChartsProps) {
  // Status distribution data
  const statusData = Object.entries(
    dossiers.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<DossierStatus, number>)
  ).map(([status, count]) => ({
    name: statusLabels[status as DossierStatus],
    value: count,
    fill: statusColors[status as DossierStatus],
  }));

  // Category distribution data
  const categoryData = Object.entries(
    dossiers.reduce((acc, d) => {
      const cat = d.category || 'outros';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({
    category: categoryLabels[category] || category,
    count,
  }));

  // Top 5 dossiers by activity
  const topDossiers = [...dossiers]
    .sort((a, b) => (b.document_count + b.chronology_count) - (a.document_count + a.chronology_count))
    .slice(0, 5)
    .map((d) => ({
      name: d.title.length > 15 ? d.title.substring(0, 15) + '...' : d.title,
      documentos: d.document_count,
      entradas: d.chronology_count,
    }));

  if (dossiers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 print:hidden">
      {/* Status Distribution */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Estado dos Dossiês</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Categorias</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Dossiers */}
      {topDossiers.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Top 5 Mais Ativos</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDossiers}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="documentos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="entradas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
