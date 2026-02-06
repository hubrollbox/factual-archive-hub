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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:hidden">
      {/* Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Estado dos Dossiês</CardTitle>
          <CardDescription>Distribuição por estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
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
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Categorias</CardTitle>
          <CardDescription>Distribuição por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Dossiers */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dossiês Mais Ativos</CardTitle>
          <CardDescription>Top 5 por documentos e entradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDossiers}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="documentos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="entradas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
