
# Corrigir Criação de Usuário sem Perder Sessão do God Mode

## Problema
Quando o god_mode cria um novo usuário pelo formulário de cadastro, a chamada `supabase.auth.signUp()` automaticamente faz login com o novo usuário, deslogando o god_mode da sessão atual.

## Solução
Criar uma backend function que usa credenciais administrativas para criar o usuário, sem afetar a sessão do administrador logado. Isso tambem corrige o erro de build do TypeScript com a funcao `set_user_role`.

## Alteracoes

### 1. Criar Backend Function: `admin-create-user`
Arquivo: `supabase/functions/admin-create-user/index.ts`

- Recebe os dados do novo usuario (name, username, password, role, company, sector, position, whatsapp, isActive)
- Valida que o usuario chamando eh god_mode ou admin (via token JWT)
- Usa o Supabase Admin API (service role) para criar o usuario sem afetar a sessao atual
- Configura profile, role, e setor em uma unica chamada server-side
- Retorna sucesso/erro

### 2. Modificar `UserRegistrationForm.tsx`
- Substituir a chamada direta a `supabase.auth.signUp()` por uma chamada a funcao backend `admin-create-user`
- Remover toda a logica de update de profile/role/sector que era feita client-side
- Manter o mesmo formulario e validacao

### 3. Corrigir erro de build em `UsersPage.tsx`
- A funcao RPC `set_user_role` existe no banco mas nao esta nos types gerados
- Usar cast `.rpc('set_user_role' as any, ...)` como workaround temporario ate os types serem regenerados

## Detalhes Tecnicos

### Backend Function `admin-create-user`

```text
Fluxo:
1. Recebe POST com dados do usuario
2. Extrai JWT do header Authorization
3. Verifica role do chamador (god_mode ou admin)
4. Cria usuario via supabaseAdmin.auth.admin.createUser()
   - Isso NAO afeta a sessao do chamador
5. Atualiza profile (name, username, whatsapp, company_id, position_id, is_active)
6. Insere em profile_sectors
7. Atualiza user_roles se role != 'user'
8. Retorna { success: true, userId }
```

### Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/admin-create-user/index.ts` | Criar |
| `src/components/users/UserRegistrationForm.tsx` | Modificar - usar edge function |
| `src/pages/UsersPage.tsx` | Corrigir - fix TypeScript error |
