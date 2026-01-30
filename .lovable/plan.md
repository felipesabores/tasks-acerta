

# Plano: Gerar PDF do Relatório Executivo

## Objetivo
Criar uma página dedicada com o Relatório Executivo do Sistema AcertaMais e um botão para exportar como PDF pronto para impressão.

---

## Implementação

### Etapa 1: Instalar Dependências

Adicionar as bibliotecas necessárias para geração de PDF:
- `jspdf` - Biblioteca para criar documentos PDF
- `html2canvas` - Converte elementos HTML em imagens para o PDF

### Etapa 2: Criar Página do Relatório

Criar uma nova página `src/pages/ExecutiveReportPage.tsx` com:

**Estrutura do Conteúdo:**
- Cabeçalho com logo e título "Relatório Executivo - AcertaMais"
- Data de geração
- Seções organizadas:
  1. Visão Geral do Sistema
  2. Arquitetura e Modelo de Dados
  3. Papéis de Acesso (RBAC)
  4. Funcionalidades Implementadas
  5. Casos de Uso Principais
  6. Dados Atuais (busca do banco)
  7. Problemas Identificados
  8. Melhorias Sugeridas
  9. Resumo Executivo

**Funcionalidades:**
- Botão "Exportar PDF" no topo
- Layout otimizado para impressão (A4)
- Estilos específicos para visualização e para PDF

### Etapa 3: Implementar Geração de PDF

Usar o padrão `html2canvas` + `jspdf`:
- Capturar o elemento do relatório como canvas
- Converter para imagem PNG
- Calcular dimensões para formato A4
- Suporte a múltiplas páginas se o conteúdo exceder uma página
- Salvar como "relatorio-executivo-acertamais.pdf"

### Etapa 4: Adicionar Rota e Menu

- Nova rota `/executive-report` no `App.tsx`
- Link no menu lateral (visível apenas para god_mode)
- Ícone: FileText do lucide-react

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/ExecutiveReportPage.tsx` | Criar - Página completa do relatório |
| `src/components/report/ReportSection.tsx` | Criar - Componente reutilizável para seções |
| `src/hooks/useExecutiveReport.ts` | Criar - Hook para buscar dados do banco |
| `src/App.tsx` | Modificar - Adicionar rota |
| `src/components/layout/AppSidebar.tsx` | Modificar - Adicionar link no menu |

---

## Detalhes Técnicos

### Geração de PDF Multi-Página
```typescript
const generatePDF = async () => {
  const element = reportRef.current;
  const canvas = await html2canvas(element, { scale: 2 });
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;
  
  // Primeira página
  pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  
  // Páginas adicionais se necessário
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  
  pdf.save('relatorio-executivo-acertamais.pdf');
};
```

### Estilos para Impressão
O componente terá estilos específicos para garantir boa aparência no PDF:
- Fundo branco
- Fontes legíveis (mínimo 12pt)
- Margens adequadas
- Tabelas com bordas visíveis
- Quebras de página apropriadas

---

## Resultado Esperado

Uma página acessível via menu "Relatório Executivo" (god_mode) que:
1. Exibe o relatório completo formatado
2. Permite visualizar antes de exportar
3. Gera PDF de alta qualidade com um clique
4. PDF pronto para impressão em formato A4

