
# Plano: Ajustes no Sistema de Tarefas Diárias e Controle de Pendências

## Resumo Executivo

Este plano aborda melhorias fundamentais no sistema de tarefas diárias, incluindo:

1. **Simplificação do formulário de tarefas** - Remover campos desnecessários e definir setor automaticamente
2. **Sistema de clonagem diária** - Tarefas do dia anterior são copiadas automaticamente
3. **Controle de pendências** - Bloqueio de painel e ranking para usuários com dias pendentes
4. **Alertas para gestores** - Notificação sobre usuários com pendências

---

## 1. Alterações no Formulário de Nova Tarefa

### Campos a Remover
- **Pontuação** - Será calculada automaticamente baseada na criticidade
- **Status** - Toda tarefa inicia como "pendente"
- **Data de entrega** - Tarefas são diárias, não possuem data específica
- **Seletor de setor** - O setor será definido automaticamente

### Campos a Manter (com ajustes)
- **Título** - Obrigatório
- **Descrição** - Agora **obrigatória** (antes era opcional)
- **Responsável** - Obrigatório (o setor será inferido deste campo)
- **Criticidade** - Obrigatório (define a pontuação automaticamente)
- **Tarefa obrigatória** - Checkbox
- **Checklist** - Opcional

### Lógica de Setor Automático
Quando o responsável é selecionado, o sistema busca o primeiro setor vinculado a ele na tabela `profile_sectors` e preenche automaticamente o campo `sector_id` da tarefa.

---

## 2. Sistema de Clonagem Diária de Tarefas

### Comportamento Atual (Problemático)
As tarefas são registros únicos que dependem de verificação de conclusão do dia. Isso causa problemas de histórico e rastreamento.

### Novo Comportamento
Criar um **job ou trigger diário** que:
1. Na virada do dia (ou na primeira ação do usuário no novo dia), cria cópias das tarefas ativas
2. Cada dia possui seu próprio conjunto de tarefas
3. O histórico de tarefas anteriores é preservado

### Abordagem Recomendada
Adicionar campo `reference_date` (ou `task_date`) na tabela `tasks` para indicar a qual dia a tarefa pertence. Tarefas do dia atual são clones das tarefas do dia anterior quando o usuário acessa o sistema.

### Campos a Adicionar na Tabela `tasks`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `task_date` | DATE | Data para qual a tarefa é válida |
| `parent_task_id` | UUID | Referência à tarefa original (template) |
| `is_template` | BOOLEAN | Indica se é uma tarefa modelo |

---

## 3. Controle de Pendências

### Cenário: Usuário não finalizou o dia anterior

Quando o usuário acessa o sistema e possui tarefas do dia anterior sem registro de conclusão:

1. **Painel de tarefas bloqueado**
   - Não exibe as tarefas do dia atual
   - Exibe um aviso destacado informando a pendência

2. **Remoção do ranking**
   - Usuário é removido do leaderboard
   - Uma flag "pendente" é exibida no lugar

3. **Mensagem ao usuário**
   - Aviso explicando que precisa finalizar o dia anterior
   - Lista as tarefas pendentes do dia anterior
   - Botões para finalizar cada tarefa

4. **Alerta ao gestor**
   - Criar registro na tabela `admin_alerts` informando sobre a pendência
   - Filtrar por setor para que o gestor veja apenas usuários do seu setor

### Nova Tabela/Campo Necessário
Adicionar campo `has_pending_day` (BOOLEAN) ou consulta dinâmica para verificar status.

---

## 4. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/tasks/TaskFormDialog.tsx` | Remover campos, tornar descrição obrigatória, auto-preencher setor |
| `src/hooks/useTasks.ts` | Atualizar TaskFormData, buscar setor do usuário selecionado |
| `src/hooks/useDailyTasks.ts` | Adicionar verificação de pendências do dia anterior |
| `src/hooks/useLeaderboard.ts` | Filtrar usuários com pendências do ranking |
| `src/pages/UserHomePage.tsx` | Exibir aviso de pendência e bloquear painel |
| `src/pages/MyTasksPage.tsx` | Exibir aviso de pendência e bloquear painel |
| `src/components/leaderboard/Leaderboard.tsx` | Marcar usuários pendentes |
| `src/components/leaderboard/HorizontalLeaderboard.tsx` | Marcar usuários pendentes |

---

## 5. Migrações de Banco de Dados

### Migração 1: Adicionar campos à tabela tasks

```sql
-- Adicionar campos para sistema de clonagem
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;
```

### Migração 2: Adicionar tabela de status de pendência (opcional)

Uma alternativa é criar uma view ou função que calcula dinamicamente se o usuário tem pendências.

```sql
-- Função para verificar pendências
CREATE OR REPLACE FUNCTION has_pending_tasks(p_profile_id UUID, p_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.assigned_to = p_profile_id
      AND t.task_date = p_date
      AND NOT EXISTS (
        SELECT 1 FROM daily_task_completions dtc
        WHERE dtc.task_id = t.id
          AND dtc.profile_id = p_profile_id
          AND dtc.completion_date = p_date
      )
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Fluxo de Criação de Tarefa Atualizado

```text
+-------------------+
| Preencher Título  |
+-------------------+
         |
         v
+-------------------+
| Preencher Descrição (OBRIGATÓRIO) |
+-------------------+
         |
         v
+-------------------+
| Selecionar Responsável |
+-------------------+
         |
    (automático)
         v
+-------------------+
| Setor preenchido automaticamente |
| baseado no responsável           |
+-------------------+
         |
         v
+-------------------+
| Selecionar Criticidade |
+-------------------+
         |
    (automático)
         v
+-------------------+
| Pontuação calculada automaticamente |
| baseada na criticidade              |
+-------------------+
```

---

## 7. Fluxo de Verificação de Pendências

```text
+------------------------+
| Usuário acessa sistema |
+------------------------+
         |
         v
+--------------------------------+
| Verificar: existem tarefas do |
| dia anterior sem conclusão?    |
+--------------------------------+
         |
    +----+----+
    |         |
   SIM       NÃO
    |         |
    v         v
+----------------+  +------------------+
| Bloquear painel|  | Exibir tarefas   |
| Remover ranking|  | do dia atual     |
| Mostrar aviso  |  +------------------+
| Alertar gestor |
+----------------+
         |
         v
+------------------------+
| Usuário finaliza dia   |
| anterior               |
+------------------------+
         |
         v
+------------------------+
| Desbloquear painel     |
| Retornar ao ranking    |
+------------------------+
```

---

## 8. Detalhes Técnicos

### Hook useDailyTasks - Novas Funções

```typescript
// Verificar se tem pendências do dia anterior
const checkPendingDays = async (profileId: string) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Buscar tarefas de ontem
  const { data: yesterdayTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('assigned_to', profileId)
    .eq('task_date', yesterdayStr);
  
  // Buscar conclusões de ontem
  const { data: yesterdayCompletions } = await supabase
    .from('daily_task_completions')
    .select('task_id')
    .eq('profile_id', profileId)
    .eq('completion_date', yesterdayStr);
  
  const completedIds = yesterdayCompletions?.map(c => c.task_id) || [];
  const pendingTasks = yesterdayTasks?.filter(t => !completedIds.includes(t.id)) || [];
  
  return {
    hasPending: pendingTasks.length > 0,
    pendingCount: pendingTasks.length
  };
};
```

### Hook useLeaderboard - Filtrar Pendentes

```typescript
// Adicionar campo para marcar usuários pendentes
interface LeaderboardEntry {
  // ... campos existentes
  isPending: boolean;
}

// Na query, verificar status de pendência de cada usuário
```

### Alerta para Gestor

Quando detectada pendência, criar alerta na tabela `admin_alerts`:

```typescript
const createPendencyAlert = async (profileId: string, sectorId: string) => {
  await supabase.from('admin_alerts').insert({
    task_id: null, // Não é específico de uma tarefa
    profile_id: profileId,
    message: `${userName} possui tarefas pendentes do dia anterior`,
    alert_date: new Date().toISOString().split('T')[0]
  });
};
```

---

## 9. Interface de Bloqueio de Pendências

### Componente de Aviso

```text
+--------------------------------------------------+
|  ⚠️  ATENÇÃO: Você possui pendências            |
|                                                  |
|  Para liberar seus pontos e voltar ao ranking,   |
|  você precisa finalizar as tarefas do dia        |
|  anterior.                                       |
|                                                  |
|  [📋 Finalizar Tarefas Pendentes]               |
+--------------------------------------------------+
```

### Lista de Tarefas Pendentes do Dia Anterior

Exibir as tarefas do dia anterior com as mesmas opções de status (Concluída, Não concluída, Sem demanda).

---

## 10. Resultado Esperado

1. **Formulário simplificado** - Apenas campos essenciais, sem repetição de dados
2. **Setor automático** - Baseado no responsável selecionado
3. **Tarefas diárias clonadas** - Histórico preservado, cada dia tem suas próprias tarefas
4. **Controle de qualidade** - Usuários são incentivados a finalizar o dia
5. **Gestores informados** - Alertas sobre usuários com pendências
6. **Ranking justo** - Apenas usuários em dia participam do ranking
