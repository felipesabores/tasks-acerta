
# Plano: Cadastro de Modelos de Tarefas por Setor

## Resumo Executivo

Esta feature cria um sistema de **modelos de tarefas pré-cadastradas** que serão utilizados para preencher automaticamente o formulário de criação de tarefas. Ao selecionar um modelo no dropdown, os campos título, descrição e setor serão preenchidos automaticamente, agilizando o processo de criação de tarefas recorrentes.

---

## Escopo da Feature

### O que será criado
- Nova tabela `task_templates` no banco de dados
- Nova aba "Modelos de Tarefas" na página de gerenciamento (TasksPage)
- Componente de CRUD para cadastrar, editar e excluir modelos
- Dropdown no formulário de criação de tarefas para selecionar um modelo

### Campos do Modelo de Tarefa
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador único |
| `title` | TEXT | Sim | Título do modelo |
| `description` | TEXT | Sim | Descrição padrão da tarefa |
| `sector_id` | UUID | Sim | Setor ao qual o modelo pertence |
| `created_by` | UUID | Sim | Usuário que criou o modelo |
| `created_at` | TIMESTAMP | Sim | Data de criação |
| `updated_at` | TIMESTAMP | Sim | Data de atualização |

---

## Arquitetura da Solução

### 1. Migração de Banco de Dados

Criar tabela `task_templates` com os seguintes campos:

```sql
CREATE TABLE public.task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode visualizar templates
CREATE POLICY "Authenticated users can view task templates"
  ON public.task_templates FOR SELECT
  USING (true);

-- Admins e task_editors podem gerenciar templates
CREATE POLICY "Admins and task_editors can manage templates"
  ON public.task_templates FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'task_editor'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'task_editor'::app_role)
  );

-- Gestores de setor podem gerenciar templates do seu setor
CREATE POLICY "Sector managers can manage their sector templates"
  ON public.task_templates FOR ALL
  USING (
    has_role(auth.uid(), 'gestor_setor'::app_role) AND 
    sector_id IN (SELECT get_user_sector_ids(auth.uid()))
  )
  WITH CHECK (
    has_role(auth.uid(), 'gestor_setor'::app_role) AND 
    sector_id IN (SELECT get_user_sector_ids(auth.uid()))
  );
```

---

### 2. Hook para Gerenciamento de Templates

Criar novo hook `useTaskTemplates.ts`:

```typescript
// src/hooks/useTaskTemplates.ts
interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  sector_id: string;
  sector?: { id: string; name: string };
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TaskTemplateFormData {
  title: string;
  description: string;
  sectorId: string;
}
```

Funções:
- `fetchTemplates()` - Lista todos os templates (com join no setor)
- `fetchTemplatesBySector(sectorId)` - Lista templates de um setor específico
- `addTemplate(data)` - Cria novo template
- `updateTemplate(id, data)` - Atualiza template existente
- `deleteTemplate(id)` - Remove template

---

### 3. Componente de Gerenciamento de Templates

Criar componente `TaskTemplateManagement.tsx`:

```text
+------------------------------------------------+
|  Modelos de Tarefas                            |
|  [+ Novo Modelo]                               |
+------------------------------------------------+
|  Buscar: [______________] Setor: [Dropdown ▼] |
+------------------------------------------------+
| Título       | Descrição      | Setor   | Ações|
|--------------|----------------|---------|------|
| Limpeza sala | Limpar sala... | TI      | ✏️ 🗑️|
| Backup       | Fazer backup...| TI      | ✏️ 🗑️|
| Atendimento  | Atender...     | Vendas  | ✏️ 🗑️|
+------------------------------------------------+
```

**Dialog de Criação/Edição:**
- Campo Título (obrigatório)
- Campo Descrição (obrigatório)
- Seletor de Setor (obrigatório)

---

### 4. Integração com TaskFormDialog

Adicionar dropdown no início do formulário de criação de tarefas:

```text
+------------------------------------------------+
| Nova Tarefa                                    |
+------------------------------------------------+
| Usar modelo: [Selecione um modelo ▼]          |
|   - Limpeza sala de reunião                   |
|   - Backup diário                              |
|   - Atendimento ao cliente                     |
+------------------------------------------------+
| Título: [____________________________]         |
| Descrição: [_________________________]         |
| Responsável: [Dropdown ▼]                      |
| Setor: [Preenchido automaticamente]           |
| ...                                            |
+------------------------------------------------+
```

**Comportamento:**
1. Quando um modelo é selecionado, os campos são auto-preenchidos:
   - Título
   - Descrição
   - Setor (exibido como Badge, não editável se veio do modelo)
2. O usuário pode modificar os valores se necessário
3. O responsável ainda precisa ser selecionado manualmente

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx_task_templates.sql` | Criar | Migração da tabela |
| `src/hooks/useTaskTemplates.ts` | Criar | Hook de gerenciamento |
| `src/components/tasks/TaskTemplateManagement.tsx` | Criar | Componente de CRUD |
| `src/components/tasks/TaskFormDialog.tsx` | Modificar | Adicionar dropdown de modelos |
| `src/pages/TasksPage.tsx` | Modificar | Adicionar aba de modelos |

---

## Fluxo de Uso

### Fluxo 1: Cadastrar Modelo de Tarefa

```text
Admin/Gestor acessa "Gerenciar Tarefas"
         |
         v
Clica na aba "Modelos"
         |
         v
Clica em "+ Novo Modelo"
         |
         v
Preenche: Título, Descrição, Setor
         |
         v
Clica em "Salvar"
         |
         v
Modelo disponível no dropdown
```

### Fluxo 2: Criar Tarefa usando Modelo

```text
Usuário clica em "Nova Tarefa"
         |
         v
Seleciona modelo no dropdown
         |
         v
Campos preenchidos automaticamente
         |
         v
Seleciona Responsável
         |
         v
Ajusta Criticidade (se necessário)
         |
         v
Clica em "Criar Tarefa"
```

---

## Validações

- **Título**: Obrigatório, máximo 100 caracteres
- **Descrição**: Obrigatório, máximo 500 caracteres
- **Setor**: Obrigatório, deve existir na tabela `sectors`

---

## Permissões

| Role | Visualizar | Criar | Editar | Excluir |
|------|------------|-------|--------|---------|
| user | - | - | - | - |
| gestor_setor | Seu setor | Seu setor | Seu setor | Seu setor |
| gestor_geral | Todos | - | - | - |
| task_editor | Todos | Todos | Todos | - |
| admin | Todos | Todos | Todos | Todos |
| god_mode | Todos | Todos | Todos | Todos |

---

## Interface Visual

### Aba de Modelos na TasksPage

A página de tarefas terá uma nova estrutura com abas:

```text
+----------------------------------------------------+
| Gerenciar Tarefas                                  |
+----------------------------------------------------+
| [Tarefas] [Modelos]                               |
+----------------------------------------------------+
```

### Card do Template

```text
+------------------------------------------+
| 📋 Limpeza da sala de reunião           |
|------------------------------------------|
| Limpar e organizar a sala de reunião    |
| após cada uso, incluindo...             |
|------------------------------------------|
| 🏢 Setor: Administração  [✏️] [🗑️]     |
+------------------------------------------+
```

---

## Resultado Esperado

1. **Padronização**: Tarefas recorrentes terão sempre a mesma estrutura
2. **Agilidade**: Criação de tarefas com poucos cliques
3. **Organização por setor**: Cada setor tem seus próprios modelos
4. **Flexibilidade**: Modelos podem ser editados conforme necessário
