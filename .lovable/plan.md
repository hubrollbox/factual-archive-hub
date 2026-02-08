
# Correcao da Pagina de Arquivo

## Problemas Identificados

1. **Nao existe forma de arquivar um dossie** -- A pagina DossierDetail referencia o estado "Arquivado" (bloqueia adicao de documentos se arquivado), mas nao existe nenhum botao ou selector para alterar o estado do dossie. Resultado: a pagina de Arquivo mostra sempre vazio.

2. **Falta de funcionalidades no Arquivo** -- Sem pesquisa, sem filtros, sem opcao de desarquivar, sem estatisticas.

## Solucao em 2 Partes

### Parte 1 -- Adicionar gestao de estado ao DossierDetail

Adicionar um selector de estado (Select) na pagina de detalhe do dossie (`src/pages/DossierDetail.tsx`) que permite alterar entre: Em Analise, Pendente, Completo e Arquivado.

- Selector visivel ao lado do badge de estado atual no cabecalho
- Ao mudar, faz update imediato na base de dados via Supabase
- Mostra toast de confirmacao
- Se arquivar, desativa o formulario de adicao de documentos (ja implementado)

### Parte 2 -- Melhorar a pagina de Arquivo

Reestruturar `src/pages/Archive.tsx` com:

- **Pesquisa** -- campo de texto para filtrar por titulo, entidade ou referencia
- **Filtro por categoria** -- dropdown com as categorias existentes (Consumo, Telecomunicacoes, etc.)
- **Contagem de dossieres e documentos** -- resumo no topo
- **Botao de desarquivar** -- em cada card, botao para mudar estado de volta para "Em Analise" (com confirmacao)
- **Link para dossie** -- manter a navegacao para o detalhe do dossie
- **Estado vazio melhorado** -- com link direto para a pagina de dossies

### Parte 3 -- Otimizacao da query

Substituir o loop N+1 (uma query por dossie para contar documentos) por uma unica query com join/subselect, usando o mesmo padrao da pagina de Relatorios:

```text
dossiers com document_count:documents(count)
```

## Detalhes Tecnicos

### Ficheiros a Modificar

**`src/pages/DossierDetail.tsx`**
- Adicionar import do Select e do componente toast
- Adicionar funcao `handleStatusChange(newStatus)` que faz `supabase.from('dossiers').update({ status }).eq('id', id)`
- Adicionar Select no cabecalho ao lado do badge existente
- Recarregar dados apos mudanca de estado

**`src/pages/Archive.tsx`**
- Substituir a query N+1 por query unica com contagem embutida
- Adicionar campo de pesquisa (Input com icone Search)
- Adicionar filtro de categoria (Select com opcoes)
- Adicionar botao "Desarquivar" em cada card
- Funcao `handleUnarchive(dossierId)` que muda estado para 'em_analise'
- Melhorar estado vazio com botao "Ver Dossies"
- Remover o placeholder de "Arquivo Fisico" (nao acrescenta valor)
- Adicionar resumo no topo: "X dossies arquivados, Y documentos totais"

### Componentes Reutilizados (ja existentes)

- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Input` com icone `Search`
- `Badge`, `Button`, `Card`
- `useToast` para feedback
- Icones Lucide: `ArchiveRestore` (desarquivar), `Search`, `Filter`

### Fluxo de Dados

```text
DossierDetail                     Archive
     |                               |
     |-- [Alterar estado] ------>    |
     |   UPDATE dossiers             |
     |   SET status='arquivado'      |
     |                               |-- SELECT dossiers
     |                               |   WHERE status='arquivado'
     |                               |   + documents(count)
     |                               |
     |                               |-- [Desarquivar] 
     |                               |   UPDATE dossiers
     |                               |   SET status='em_analise'
```

### Sequencia de Implementacao

1. Modificar `DossierDetail.tsx` -- adicionar selector de estado
2. Modificar `Archive.tsx` -- reestruturar com pesquisa, filtros, desarquivar e query otimizada
