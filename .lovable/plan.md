
# Plano: Melhorias Completas - Cronologia e Relatorios

## Resumo

Este plano implementa todas as melhorias sugeridas para as paginas de Cronologia e Relatorios:

1. **Cronologia**: Edicao de entradas, confirmacao de eliminacao, pesquisa por texto, ligacao a documentos
2. **Relatorios**: Links para dossies, filtro por categoria, ordenacao, graficos visuais
3. **Exportacao PDF**: Para ambas as paginas

---

## Parte 1: Melhorias na Cronologia

### 1.1 Confirmacao de Eliminacao

Adicionar um dialogo de confirmacao (AlertDialog) antes de eliminar uma entrada para prevenir eliminacoes acidentais.

**Ficheiros afetados:**
- `src/pages/Chronology.tsx`

**Alteracoes:**
- Importar componentes AlertDialog
- Criar estado para controlar qual entrada esta a ser eliminada
- Substituir a eliminacao direta por um fluxo com confirmacao

### 1.2 Edicao de Entradas

Permitir editar entradas existentes reutilizando o formulario de criacao.

**Alteracoes:**
- Adicionar estado `editingEntry` para guardar a entrada em edicao
- Adicionar botao de edicao (icone Edit) ao lado do botao de eliminar
- Reutilizar o Dialog existente para edicao (pre-preencher o formulario)
- Criar funcao `handleUpdateEntry` para atualizar via Supabase

### 1.3 Pesquisa por Texto

Adicionar campo de pesquisa para filtrar entradas por titulo, descricao ou fonte.

**Alteracoes:**
- Adicionar estado `searchQuery` para guardar o termo de pesquisa
- Adicionar Input de pesquisa ao lado do filtro por dossie
- Filtrar `filteredEntries` pelo termo de pesquisa (case-insensitive)

### 1.4 Ligacao a Documentos (opcional)

O campo `document_id` ja existe na tabela `chronology_entries`. Adicionar selector de documento no formulario.

**Alteracoes:**
- Buscar documentos do dossie selecionado
- Adicionar Select opcional para associar documento
- Mostrar documento associado no card da entrada

---

## Parte 2: Melhorias nos Relatorios

### 2.1 Links de Navegacao para Dossies

Tornar os cards de dossie clicaveis para navegar diretamente ao detalhe.

**Ficheiros afetados:**
- `src/pages/Reports.tsx`

**Alteracoes:**
- Importar `useNavigate` do react-router-dom
- Adicionar `onClick` nos cards para navegar para `/dashboard/dossiers/{id}`
- Adicionar cursor pointer e hover state

### 2.2 Filtro por Categoria

Os dossies ja tem campo `category`. Adicionar filtro adicional.

**Alteracoes:**
- Buscar categoria na query de dossies
- Adicionar estado `filterCategory`
- Adicionar Select para filtrar por categoria
- Aplicar filtro adicional em `filteredDossiers`

### 2.3 Ordenacao

Permitir ordenar por diferentes criterios.

**Alteracoes:**
- Adicionar estado `sortBy` (updated_at, title, document_count, chronology_count)
- Adicionar Select para escolher ordenacao
- Ordenar `filteredDossiers` antes de renderizar

### 2.4 Graficos Visuais com Recharts

Adicionar graficos de distribuicao usando o componente Chart existente.

**Alteracoes:**
- Importar componentes do recharts (PieChart, BarChart, etc.)
- Adicionar seccao de graficos com:
  - Pie chart: Distribuicao por estado
  - Bar chart: Distribuicao por categoria
  - Bar chart: Top 5 dossies por documentos/entradas

---

## Parte 3: Exportacao PDF

### 3.1 Estrategia

Usar a biblioteca nativa `window.print()` com estilos de impressao, evitando dependencias adicionais pesadas.

**Alternativa mais robusta:** Criar um componente de visualizacao para impressao e usar CSS `@media print`.

### 3.2 Cronologia

**Alteracoes:**
- Adicionar botao "Exportar PDF" no header
- Criar componente `ChronologyPrintView` com layout otimizado para impressao
- Usar `window.print()` apos renderizar a vista de impressao

### 3.3 Relatorios

**Alteracoes:**
- Adicionar botao "Exportar PDF" no header
- Criar componente `ReportPrintView` com tabela resumo
- Incluir estatisticas e lista de lacunas

---

## Estrutura de Ficheiros

```text
src/
  pages/
    Chronology.tsx        (modificado)
    Reports.tsx           (modificado)
  components/
    chronology/
      ChronologyEntryCard.tsx    (novo - componente extraido)
      ChronologyForm.tsx         (novo - formulario reutilizavel)
    reports/
      ReportsCharts.tsx          (novo - graficos)
      ReportsPrintView.tsx       (novo - vista impressao)
```

---

## Detalhes Tecnicos

### Cronologia - Codigo Principal

```text
Estado adicional:
- searchQuery: string
- editingEntry: ChronologyEntry | null
- entryToDelete: string | null

Novo fluxo de eliminacao:
1. Clicar Trash2 -> abre AlertDialog
2. Confirmar -> executa handleDeleteEntry
3. Cancelar -> fecha AlertDialog

Fluxo de edicao:
1. Clicar Edit -> setEditingEntry(entry)
2. Preencher formData com dados da entrada
3. Abrir Dialog
4. Submit -> handleUpdateEntry (PUT em vez de INSERT)
```

### Relatorios - Graficos

```text
Dados para graficos:
- statusDistribution: { name: string, value: number, fill: string }[]
- categoryDistribution: { category: string, count: number }[]

Componentes recharts:
- PieChart com Pie, Cell, Tooltip, Legend
- BarChart com Bar, XAxis, YAxis, Tooltip
```

### Categorias de Dossies

Baseado na memoria do projeto, as categorias sao:
- Consumo
- Telecomunicacoes
- Transito
- Fiscal
- Trabalho
- Outros

---

## Sequencia de Implementacao

1. **Cronologia - UX basico**
   - Confirmacao de eliminacao com AlertDialog
   - Pesquisa por texto

2. **Cronologia - Edicao**
   - Refatorar formulario para criar/editar
   - Adicionar botao e logica de edicao

3. **Relatorios - Navegacao e Filtros**
   - Links clicaveis para dossies
   - Filtro por categoria
   - Ordenacao

4. **Relatorios - Graficos**
   - Componente ReportsCharts
   - Integracao com recharts

5. **Exportacao PDF**
   - Vistas de impressao
   - Botoes de exportacao

---

## Dependencias

- `recharts` - ja instalado (v2.15.4)
- `@radix-ui/react-alert-dialog` - ja instalado
- Nao sao necessarias novas dependencias

---

## Mobile-First

Todas as alteracoes respeitam a arquitetura mobile-first:
- Graficos com ResponsiveContainer
- Filtros empilhados verticalmente em mobile
- Cards de cronologia responsivos
- Vista de impressao otimizada para A4
