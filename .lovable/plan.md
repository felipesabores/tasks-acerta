
# Redesign Visual do Sistema com Padrão God Mode + Logos Dinâmicos

## Resumo
Aplicar o visual premium do God Mode (cards com gradientes, KPIs sofisticados, efeitos visuais) em todas as páginas do sistema, além de implementar logos dinâmicas que alternam automaticamente conforme o tema (claro/escuro).

## Logos Disponíveis no Storage

| Arquivo | Uso Sugerido |
|---------|--------------|
| `acerta mais azul.png` | Tema claro (AuthPage, Footer) |
| `acerta mais branco.png` | Tema escuro + Sidebar (fundo escuro) |
| `Logo acerta.png` | Alternativa colorida |
| `logo acerta branco.png` | Alternativa fundo escuro |

## Mudanças Planejadas

### 1. Sistema de Logo Dinâmica
Criar um componente reutilizavel que alterna automaticamente entre as logos:

**Novo arquivo: `src/components/ui/logo.tsx`**
- Detecta o tema atual via `useTheme()` do `next-themes`
- Exibe logo azul no tema claro
- Exibe logo branca no tema escuro
- Props para tamanho customizavel

### 2. Atualizar Locais que Usam Logo

| Local | Comportamento |
|-------|---------------|
| **AuthPage** | Logo azul (claro) / branca (escuro) |
| **AppSidebar** | Sempre logo branca (fundo sempre escuro) |
| **Footer** | Logo azul (claro) / branca (escuro) |

### 3. Redesign das Paginas com Estilo God Mode

#### UserHomePage (Inicio)
- Substituir cards basicos por KPICard com gradientes
- UserGreeting com visual mais sofisticado
- Melhorar espacamento e hierarquia visual

#### MyTasksPage (Minhas Tarefas)
- Stats cards convertidos para KPICard
- Visual consistente com God Mode

#### LeaderboardPage (Ranking)
- Header mais elaborado com icone estilizado
- Cards com bordas gradientes

#### TasksPage (Gerenciar Tarefas)
- Melhorar visual dos filtros
- Header com estilo consistente

#### UsersPage (Usuarios)
- Cards de roles com visual premium
- Tabela com hover states melhorados

### 4. Componentes Reutilizaveis a Criar

**PageHeader Component** (`src/components/ui/page-header.tsx`)
```text
+------------------------------------------+
| [Icon with gradient bg] Title            |
| Subtitle description                     |
+------------------------------------------+
```

**EnhancedStatsCard** - Wrapper do KPICard para uso geral

### 5. Atualizacoes de Estilo Global

- Adicionar classes utilitarias para gradientes
- Melhorar transicoes e hover states
- Unificar sombras e bordas

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/ui/logo.tsx` | **NOVO** - Componente de logo dinamica |
| `src/components/ui/page-header.tsx` | **NOVO** - Header padrao para paginas |
| `src/pages/AuthPage.tsx` | Usar Logo dinamica |
| `src/components/layout/Footer.tsx` | Usar Logo dinamica |
| `src/components/layout/AppSidebar.tsx` | Usar Logo branca (fixa) |
| `src/pages/UserHomePage.tsx` | Redesign com KPICard + PageHeader |
| `src/pages/MyTasksPage.tsx` | Redesign com KPICard + PageHeader |
| `src/pages/LeaderboardPage.tsx` | PageHeader + visual melhorado |
| `src/pages/TasksPage.tsx` | PageHeader + visual consistente |
| `src/pages/UsersPage.tsx` | Redesign cards de roles |
| `src/components/home/UserGreeting.tsx` | Visual mais sofisticado |

## Detalhes Tecnicos

### Componente Logo
```typescript
// Detecta tema e alterna logo automaticamente
const { resolvedTheme } = useTheme();
const logoUrl = resolvedTheme === 'dark' 
  ? LOGO_WHITE_URL 
  : LOGO_BLUE_URL;
```

### KPICard - Variantes para Reutilizacao
Os cards do God Mode ja possuem variantes (`primary`, `success`, `warning`, `danger`) que serao aproveitadas em todo o sistema.

### Padrao Visual
- Gradientes sutis: `from-{color}/10 via-{color}/5 to-transparent`
- Bordas coloridas: `border-{color}/20`
- Sombras: `shadow-sm hover:shadow-md`
- Transicoes: `transition-all duration-300`

## Resultado Esperado

Todas as paginas terao:
- Visual premium consistente com God Mode
- Logos que alternam automaticamente com o tema
- Cards com gradientes e efeitos visuais
- Headers padronizados com icones estilizados
- Experiencia visual unificada e profissional
