
# Reorganizacao da Pagina de Relatorios em 3 Blocos

## Objetivo

Reestruturar completamente a pagina de Relatorios (`src/pages/Reports.tsx`) para deixar de ser uma lista corrida de cards de dossies e passar a ser uma interface organizada em **3 blocos hierarquicos**, focada na geracao e exportacao de relatorios por dossie.

## Estrutura Proposta

```text
+--------------------------------------------+
| Header: Relatorios + [Atualizar]           |
+--------------------------------------------+
|                                            |
| BLOCO 1 - Relatorios Principais           |
| (sempre visivel)                           |
|                                            |
| [Selector de Dossie]                       |
|                                            |
| +--------+ +----------+ +----------+      |
| |Relatorio| |Cronologia| |Relatorio |      |
| |do Dossie| |Factual   | |de Lacunas|      |
| |  (PDF)  | |(PDF/CSV) | |  (PDF)   |      |
| +--------+ +----------+ +----------+      |
|                                            |
+--------------------------------------------+
|                                            |
| > Relatorios Tecnicos (colapsado)          |
|   - Inconsistencias                        |
|   - Relacoes entre documentos              |
|   - Atividade / historico                  |
|                                            |
+--------------------------------------------+
|                                            |
| > Exportacoes Brutas (colapsado)           |
|   - CSV documentos                         |
|   - CSV cronologia                         |
|   - CSV dossie                             |
|                                            |
+--------------------------------------------+
```

## Detalhes por Bloco

### BLOCO 1 -- Relatorios Principais (visivel por defeito)

Contem um selector de dossie no topo e 3 cards de acao, cada um com icone, titulo, descricao curta e botao de geracao/exportacao:

1. **Relatorio do Dossie (PDF)** -- Resumo completo do dossie incluindo indice de documentos, estado atual, entidade principal e descricao. Usa `window.print()` com vista formatada.

2. **Cronologia Factual (PDF / CSV)** -- Timeline ordenada de todos os eventos do dossie. Opcao de exportar como PDF (via impressao) ou como CSV (download direto).

3. **Relatorio de Lacunas (PDF)** -- Identifica documentacao em falta: dossie sem documentos, sem cronologia, sem datas, etc. Exporta via `window.print()`.

Cada card mostra um badge com o numero de itens relevantes (ex.: "12 documentos", "5 entradas", "2 lacunas").

### BLOCO 2 -- Relatorios Tecnicos (colapsado por defeito)

Usa o componente `Collapsible` do Radix (ja instalado). Abre com clique em "Relatorios Avancados".

3 cards descritivos:

1. **Inconsistencias** -- Identifica datas fora de ordem, documentos sem data, entradas de cronologia sem fonte. Mostra contagem de alertas.

2. **Relacoes entre Documentos** -- Lista quais entradas da cronologia estao ligadas a documentos e quais nao. Mostra percentagem de cobertura.

3. **Atividade / Historico** -- Mostra os graficos atuais (distribuicao por estado e categoria) movidos para aqui, representando metricas tecnicas do portfolio.

### BLOCO 3 -- Exportacoes Brutas (colapsado por defeito)

Tambem usa `Collapsible`. 3 botoes simples de download:

1. **CSV Documentos** -- Exporta todos os documentos do dossie selecionado como CSV.
2. **CSV Cronologia** -- Exporta todas as entradas cronologicas como CSV.
3. **CSV Dossie** -- Exporta os metadados do dossie como CSV.

Se nenhum dossie estiver selecionado, os botoes ficam desativados com mensagem "Selecione um dossie primeiro".

## Detalhes Tecnicos

### Ficheiros a Modificar

- **`src/pages/Reports.tsx`** -- Reescrita quase total da UI (manter a logica de dados existente)

### Ficheiros a Criar

- **`src/components/reports/ReportBlock.tsx`** -- Componente reutilizavel para cada card de relatorio (icone, titulo, descricao, badge, botao de acao)
- **`src/components/reports/DossierSelector.tsx`** -- Selector de dossie com resumo rapido do dossie selecionado
- **`src/components/reports/GapsReport.tsx`** -- Logica de analise de lacunas expandida
- **`src/components/reports/InconsistenciesReport.tsx`** -- Analise de inconsistencias (datas, fontes em falta)
- **`src/components/reports/DocumentRelationsReport.tsx`** -- Analise de cobertura documentos-cronologia
- **`src/components/reports/CsvExporter.tsx`** -- Utilitario para gerar e descarregar ficheiros CSV

### Ficheiros Existentes a Manter

- **`src/components/reports/ReportsCharts.tsx`** -- Move para dentro do Bloco 2 (Atividade/Historico)
- **`src/components/reports/ReportsPrintView.tsx`** -- Atualizada para servir o Relatorio do Dossie do Bloco 1
- **`FinalReportView`** (em Reports.tsx) -- Refatorada para componente separado

### Logica de Dados

A query principal mantem-se igual, buscando todos os dossies com contagens. Quando o utilizador seleciona um dossie:

1. Busca documentos completos (`documents` filtrados por `dossier_id`)
2. Busca cronologia completa (`chronology_entries` filtrados por `dossier_id`)
3. Calcula lacunas e inconsistencias no frontend
4. Disponibiliza dados para cada bloco

### Geracao de CSV

Funcao utilitaria pura (sem dependencias externas):

```text
function downloadCSV(headers: string[], rows: string[][], filename: string)
  - Converte para string CSV com separador ";"
  - Cria Blob com BOM UTF-8 para compatibilidade com Excel
  - Dispara download via link temporario
```

### Analise de Inconsistencias (Bloco 2)

Verifica:
- Entradas de cronologia sem `source_reference` (fonte nao indicada)
- Documentos sem `document_date` (data em falta)
- Entradas de cronologia com `event_date` posterior a documentos referenciados
- Entradas sem `document_id` (sem ligacao a documento)

### Analise de Relacoes (Bloco 2)

Calcula:
- Total de entradas de cronologia
- Entradas com `document_id` preenchido vs. vazio
- Percentagem de cobertura documental
- Lista de documentos nao referenciados em nenhuma entrada

### Componentes UI Utilizados

Todos ja instalados, sem novas dependencias:
- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` (Radix)
- `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription`
- `Button`, `Badge`, `Select`, `Separator`
- Icones Lucide: `FileText`, `Clock`, `AlertTriangle`, `Download`, `ChevronDown`, `Link2`, `Activity`, `Table`

### Impressao (Print Views)

Os blocos 2 e 3 ficam ocultos na impressao (`print:hidden`). Apenas o conteudo do relatorio selecionado no Bloco 1 e impresso, usando a mesma estrategia `window.print()` + CSS `@media print` ja implementada.

### Mobile-First

- Cards do Bloco 1 empilham verticalmente em mobile (1 coluna)
- Selector de dossie ocupa largura total em mobile
- Blocos colapsaveis funcionam nativamente em touch
- Botoes de exportacao com texto completo em desktop, so icone em mobile

## Sequencia de Implementacao

1. Criar utilitario `CsvExporter.tsx` (funcao pura, sem dependencias de UI)
2. Criar `ReportBlock.tsx` (componente visual reutilizavel)
3. Criar `DossierSelector.tsx` (selector com resumo)
4. Criar componentes de analise (Gaps, Inconsistencies, Relations)
5. Reescrever `Reports.tsx` com a nova estrutura em 3 blocos
6. Atualizar `ReportsPrintView.tsx` para o novo formato do Bloco 1
