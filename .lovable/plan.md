
# Relatório Executivo - Sistema AcertaMais

## 1. Visão Geral do Sistema

O AcertaMais é um sistema de gestão de tarefas diárias com gamificação, ranking de desempenho e controle hierárquico de acesso. O sistema foi recentemente atualizado para utilizar **Empresas como entidade central**, vinculando setores, cargos e usuários de forma hierárquica.

---

## 2. Arquitetura Atual

### Estrutura de Dados

```text
EMPRESA
   |
   +---> SETORES (vinculados à empresa)
   |
   +---> CARGOS (vinculados à empresa)

USUÁRIO
   |
   +---> username (login)
   +---> company_id (empresa)
   +---> position_id (cargo via dropdown)
   +---> cargo (campo texto legado - PROBLEMA)
   +---> sector (via profile_sectors)
   +---> is_active (status da conta)
```

### Papéis de Acesso (RBAC)

| Papel | Descrição | Permissões |
|-------|-----------|------------|
| god_mode | Supervisão total | Tudo + Painel avançado |
| admin | Administrador | Gestão de usuários e tarefas |
| task_editor | Editor de Tarefas | Criar/editar tarefas |
| gestor_setor | Gestor de Setor | Gerencia tarefas do seu setor |
| gestor_geral | Gestor Geral | Visualiza todas as tarefas (somente leitura) |
| user | Usuário comum | Executa tarefas diárias |

---

## 3. Funcionalidades Implementadas

### 3.1 Autenticação
- Login por **username** (não email)
- Função RPC `get_email_by_username` mapeia username para email interno
- Verificação de `is_active` no `ProtectedRoute`
- Logout automático para usuários inativos

### 3.2 Gestão de Empresas (god_mode)
- CRUD de empresas com setores e cargos
- Interface de cadastro integrada
- Dropdowns em cascata no cadastro de usuários

### 3.3 Cadastro de Usuários (god_mode)
- Campos: username, senha, função, empresa, setor, cargo
- Dropdowns dinâmicos filtrados por empresa
- Status ativo/inativo

### 3.4 Sistema de Tarefas
- Criação de tarefas com descrição obrigatória
- Criticidade: baixa, média, alta, crítica
- Pontuação automática baseada na criticidade
- Checklist opcional
- Templates de tarefas reutilizáveis
- Clonagem diária automática

### 3.5 Tarefas Diárias (Usuários)
- Visualização das tarefas do dia
- Três opções de finalização: Concluída, Não concluída, Sem demanda
- Bloqueio por pendências de dias anteriores
- Alertas automáticos para gestores

### 3.6 Ranking e Gamificação
- Pontuação acumulada por usuário
- Leaderboard horizontal e vertical
- Configuração de pontos por criticidade

### 3.7 Painel God Mode
- KPIs avançados com filtro de período
- Gráfico de desempenho
- Distribuição por criticidade (donut chart)
- Alertas e ranking de usuários

---

## 4. Problemas Identificados

### 4.1 CRÍTICO: Edição de Usuário Desatualizada

**Arquivo**: `src/pages/UsersPage.tsx` (linhas 470-530)

O diálogo de edição de usuário **NÃO segue** a nova arquitetura:

| Campo Atual | Deveria Ser |
|-------------|-------------|
| Nome (texto livre) | Nome (texto livre) - OK |
| Cargo (texto livre) | Cargo (dropdown vinculado à empresa) |
| WhatsApp (texto) | WhatsApp (texto) - OK |
| - | Username (editável) |
| - | Empresa (dropdown) |
| - | Setor (dropdown vinculado à empresa) |
| - | Status Ativo (checkbox) |

**Consequência**: Usuários editados perdem o vínculo com empresa/setor/cargo estruturado.

### 4.2 Dados Legados

Existem usuários sem os campos novos preenchidos:

| Usuário | Username | Empresa | Cargo (position_id) |
|---------|----------|---------|---------------------|
| Felipe Carvalho | felipe.acerta | NULL | NULL |
| Weverton Rodrigues | NULL | NULL | NULL |
| SAULLO GONCALVES SCHMITTEL | NULL | NULL | NULL |
| igorhalla | igorhalla | Acerta Matriz | Assistente |

### 4.3 Campo `cargo` Duplicado

A tabela `profiles` possui:
- `cargo` (TEXT) - Campo legado com texto livre
- `position_id` (UUID) - Campo novo com FK para `company_positions`

Ambos coexistem, causando inconsistência.

### 4.4 Tabela de Usuários Não Exibe Novos Campos

A listagem de usuários na aba "Usuários":
- Não exibe empresa
- Não exibe setor
- Não exibe status ativo/inativo
- Não exibe username

### 4.5 Falta Nome Completo no Cadastro

O formulário de cadastro de usuários não possui campo para **nome completo**. Atualmente usa o username como nome do perfil.

---

## 5. Casos de Uso

### UC01: Cadastrar Empresa
**Ator**: god_mode
**Fluxo**:
1. Acessa Gerenciar Usuários > Empresas
2. Clica em "Nova Empresa"
3. Preenche nome
4. Adiciona setores
5. Adiciona cargos
6. Salva

### UC02: Cadastrar Usuário
**Ator**: god_mode
**Fluxo**:
1. Acessa Gerenciar Usuários > Cadastrar
2. Preenche username, senha, função
3. Seleciona empresa (carrega setores e cargos)
4. Seleciona setor e cargo
5. Define status ativo
6. Cadastra

### UC03: Login
**Ator**: Todos
**Fluxo**:
1. Digita username
2. Digita senha
3. Sistema busca email via RPC
4. Autentica via Supabase Auth
5. Verifica is_active
6. Redireciona conforme papel

### UC04: Finalizar Tarefa Diária
**Ator**: user, gestor_setor
**Fluxo**:
1. Verifica pendências de dias anteriores
2. Se há pendências, resolve primeiro
3. Visualiza tarefas do dia
4. Seleciona status (Concluída/Não concluída/Sem demanda)
5. Finaliza tarefa
6. Pontos são calculados automaticamente

### UC05: Editar Usuário (PROBLEMA)
**Ator**: god_mode, admin
**Fluxo Atual**:
1. Clica no ícone de edição
2. Edita nome, cargo (texto livre), whatsapp
3. Salva

**Fluxo Esperado**:
1. Clica no ícone de edição
2. Edita nome, username, whatsapp
3. Seleciona empresa (filtra setores/cargos)
4. Seleciona setor e cargo
5. Define status ativo
6. Salva

---

## 6. Melhorias Sugeridas

### Alta Prioridade

1. **Atualizar Dialog de Edição de Usuário**
   - Adicionar campos: username, empresa, setor, cargo (dropdown), is_active
   - Usar mesma lógica de cascata do cadastro
   - Remover campo cargo como texto livre

2. **Adicionar Campo Nome Completo no Cadastro**
   - Incluir campo obrigatório para nome completo
   - Usar esse nome no perfil e nas tarefas

3. **Atualizar Tabela de Listagem de Usuários**
   - Exibir: username, empresa, setor (via join), cargo, status

4. **Migrar Dados Legados**
   - Script para atualizar usuários existentes com empresa/setor/cargo

### Média Prioridade

5. **Remover Campo `cargo` (texto) da Tabela Profiles**
   - Migrar dados para `position_id`
   - Remover coluna após migração

6. **Adicionar Filtros na Listagem de Usuários**
   - Filtro por empresa
   - Filtro por setor
   - Filtro por status ativo/inativo

7. **Validação de Username Único no Cadastro**
   - Verificar em tempo real se username já existe

### Baixa Prioridade

8. **Histórico de Alterações**
   - Log de mudanças em perfis de usuários

9. **Exportação de Dados**
   - Relatório CSV de usuários e empresas

10. **Notificações por WhatsApp**
    - Integrar com API do WhatsApp para alertas

---

## 7. Plano de Correção Imediata

### Etapa 1: Atualizar Dialog de Edição

Modificar `src/pages/UsersPage.tsx`:

1. Adicionar states para empresa, setor, cargo, is_active
2. Implementar dropdowns em cascata (igual ao cadastro)
3. Carregar dados atuais do usuário ao abrir
4. Atualizar campos corretos no save

### Etapa 2: Adicionar Nome no Cadastro

Modificar `src/components/users/UserRegistrationForm.tsx`:

1. Adicionar campo `name` (obrigatório)
2. Usar esse campo no profile em vez do username

### Etapa 3: Atualizar Listagem

Modificar `src/pages/UsersPage.tsx`:

1. Fazer join com companies, sectors, company_positions
2. Exibir colunas adicionais na tabela
3. Adicionar badge de status ativo/inativo

---

## 8. Resumo Executivo

| Aspecto | Status |
|---------|--------|
| Autenticação | Funcionando |
| Cadastro de Empresas | Funcionando |
| Cadastro de Usuários | Funcionando (falta nome) |
| **Edição de Usuários** | **DESATUALIZADA** |
| Listagem de Usuários | Incompleta |
| Sistema de Tarefas | Funcionando |
| Gamificação | Funcionando |
| Painel God Mode | Funcionando |
| Dados Legados | Precisam migração |

**Ação Recomendada**: Atualizar imediatamente o dialog de edição de usuários para seguir a nova arquitetura do sistema.
