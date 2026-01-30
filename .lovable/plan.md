
# Reorganização do Menu por Role

## Resumo
Ajustar o menu lateral para que cada perfil veja apenas os itens relevantes para sua função, removendo "Minhas Tarefas" do admin já que ele apenas supervisiona.

## Estrutura Final do Menu

```text
┌─────────────────────────────────────────────────────────────────┐
│  ROLE          │  ITENS DO MENU                                 │
├─────────────────────────────────────────────────────────────────┤
│  Usuário       │  🏠 Início                                      │
│  (user)        │  📋 Minhas Tarefas                              │
│                │  🏆 Ranking                                     │
├─────────────────────────────────────────────────────────────────┤
│  Editor        │  🏠 Início                                      │
│  (task_editor) │  📋 Minhas Tarefas                              │
│                │  ✏️ Gerenciar Tarefas                           │
│                │  🏆 Ranking                                     │
├─────────────────────────────────────────────────────────────────┤
│  Admin         │  🏠 Início (Dashboard)                          │
│  (admin)       │  ✏️ Gerenciar Tarefas                           │
│                │  🏆 Ranking (+ config pontuação)                │
│                │  👥 Usuários                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Alteração Necessária

### Arquivo: `src/components/layout/AppSidebar.tsx`

**O que muda:**
- O item "Minhas Tarefas" será exibido apenas para usuários que **não são admin**
- Condição atual: `visible to all users`
- Nova condição: `visible to users and task_editors (not admin)`

**Lógica:**
```typescript
// Antes
{/* My Tasks - visible to all users */}
<SidebarMenuItem>...</SidebarMenuItem>

// Depois  
{/* My Tasks - visible to users and task editors, NOT admin */}
{!isAdmin && (
  <SidebarMenuItem>...</SidebarMenuItem>
)}
```

## Detalhes Técnicos

A variável `isAdmin` já existe no componente (linha 28), então basta adicionar a condição `{!isAdmin && (...)}` ao redor do item "Minhas Tarefas" nas linhas 82-94.

## Resultado Esperado

| Role | Início | Minhas Tarefas | Gerenciar Tarefas | Ranking | Usuários |
|------|--------|----------------|-------------------|---------|----------|
| user | ✅ | ✅ | ❌ | ✅ | ❌ |
| task_editor | ✅ | ✅ | ✅ | ✅ | ❌ |
| admin | ✅ | ❌ | ✅ | ✅ | ✅ |
