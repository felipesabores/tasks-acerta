
# Plano: Sistema Completo de Empresas com Setores e Cargos

## Resumo Executivo

Este plano implementa uma reestruturacao completa onde **empresas sao a entidade central** que agrega tanto **setores** quanto **cargos**. Ao cadastrar uma empresa, o usuario podera adicionar os setores e cargos disponiveis naquela empresa. No cadastro de usuarios, ao selecionar a empresa, os dropdowns de setor e cargo serao filtrados automaticamente.

---

## 1. Nova Arquitetura de Dados

### Relacionamentos

```text
+------------------+
|     EMPRESA      |
+------------------+
        |
        +-------> SETORES (pertencentes a empresa)
        |
        +-------> CARGOS (pertencentes a empresa)

+------------------+
|     USUARIO      |
+------------------+
        |
        +-------> empresa_id
        +-------> position_id (cargo da empresa)
        +-------> setor (via profile_sectors, agora company_sectors)
```

### Impacto na Tabela Existente `sectors`

A tabela `sectors` atual e **global** (sem vinculo com empresa). Temos duas opcoes:

**Opcao Escolhida**: Adicionar `company_id` na tabela `sectors` existente, tornando setores vinculados a empresas.

---

## 2. Estrutura de Banco de Dados

### Nova Tabela: `companies`

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador unico |
| `name` | TEXT | Sim | Nome da empresa (unico) |
| `created_at` | TIMESTAMPTZ | Sim | Data de criacao |
| `updated_at` | TIMESTAMPTZ | Sim | Data de atualizacao |

### Nova Tabela: `company_positions` (Cargos por Empresa)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | UUID | Sim | Identificador unico |
| `company_id` | UUID | Sim | Referencia para empresa |
| `name` | TEXT | Sim | Nome do cargo |
| `created_at` | TIMESTAMPTZ | Sim | Data de criacao |

### Alteracao na Tabela `sectors`

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `company_id` | UUID | Sim | Referencia para empresa |

### Alteracoes na Tabela `profiles`

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `username` | TEXT | Sim | Username unico para login |
| `company_id` | UUID | Nao | Referencia para empresa |
| `position_id` | UUID | Nao | Referencia para cargo |
| `is_active` | BOOLEAN | Sim | Status do usuario |

---

## 3. Migracao SQL

```sql
-- 1. Tabela de empresas
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de cargos por empresa
CREATE TABLE public.company_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, name)
);

-- 3. Adicionar company_id na tabela sectors
ALTER TABLE public.sectors 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 4. Adicionar campos ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.company_positions(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- 5. Trigger para updated_at em companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS para companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies"
  ON public.companies FOR SELECT USING (true);

CREATE POLICY "God mode can manage companies"
  ON public.companies FOR ALL
  USING (has_role(auth.uid(), 'god_mode'::app_role))
  WITH CHECK (has_role(auth.uid(), 'god_mode'::app_role));

-- 7. RLS para company_positions
ALTER TABLE public.company_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view positions"
  ON public.company_positions FOR SELECT USING (true);

CREATE POLICY "God mode can manage positions"
  ON public.company_positions FOR ALL
  USING (has_role(auth.uid(), 'god_mode'::app_role))
  WITH CHECK (has_role(auth.uid(), 'god_mode'::app_role));

-- 8. Funcao para buscar email pelo username
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE LOWER(p.username) = LOWER(_username)
  AND p.is_active = true
  LIMIT 1
$$;
```

---

## 4. Interface de Cadastro de Empresas

### Tela Principal

```text
+----------------------------------------------------------+
| Empresas                                      [+ Nova]   |
+----------------------------------------------------------+
| Nome           | Setores          | Cargos      | Acoes  |
|----------------|------------------|-------------|--------|
| Empresa ABC    | TI, Comercial,   | Diretor,    | [E][X] |
|                | Financeiro       | Analista    |        |
| Empresa XYZ    | Vendas, Suporte  | Gerente,    | [E][X] |
|                |                  | Atendente   |        |
+----------------------------------------------------------+
```

### Dialog de Criacao/Edicao de Empresa

```text
+----------------------------------------------------------+
| Nova Empresa                                             |
+----------------------------------------------------------+
| Nome da Empresa *                                        |
| [________________________________________]               |
|                                                          |
| +-------------------------------------------------+     |
| | SETORES                            [+ Adicionar] |     |
| +-------------------------------------------------+     |
| | Comercial                                   [X] |     |
| | Financeiro                                  [X] |     |
| | TI                                          [X] |     |
| +-------------------------------------------------+     |
|                                                          |
| +-------------------------------------------------+     |
| | CARGOS                             [+ Adicionar] |     |
| +-------------------------------------------------+     |
| | Diretor                                     [X] |     |
| | Gerente                                     [X] |     |
| | Analista                                    [X] |     |
| | Assistente                                  [X] |     |
| +-------------------------------------------------+     |
|                                                          |
| [Cancelar]                              [Salvar Empresa] |
+----------------------------------------------------------+
```

---

## 5. Novo Formulario de Cadastro de Usuario

### Campos

| Campo | Tipo | Obrigatorio | Comportamento |
|-------|------|-------------|---------------|
| Username | Input | Sim | Unico, 3-50 caracteres |
| Senha | Input | Sim | Minimo 6 caracteres |
| Funcao (role) | Dropdown | Sim | Todas as roles do sistema |
| Empresa | Dropdown | Sim | Lista de empresas |
| Setor | Dropdown | Sim | Filtra pela empresa selecionada |
| Cargo | Dropdown | Sim | Filtra pela empresa selecionada |
| Esta ativo? | Checkbox | Sim | Default: marcado |

### Interface Visual

```text
+----------------------------------------------------------+
| Cadastrar Novo Usuario                                   |
+----------------------------------------------------------+
| Username *                                               |
| [________________________]                               |
| Apenas letras, numeros e underscore                      |
|                                                          |
| Senha *                                                  |
| [________________________]                               |
|                                                          |
| Funcao no Sistema *                                      |
| [Selecione uma funcao                               v]   |
|                                                          |
| Empresa *                                                |
| [Selecione uma empresa                              v]   |
|                                                          |
| Setor *  (carrega ao selecionar empresa)                |
| [Selecione um setor                                 v]   |
|                                                          |
| Cargo *  (carrega ao selecionar empresa)                |
| [Selecione um cargo                                 v]   |
|                                                          |
| [x] Usuario ativo                                        |
|                                                          |
| [            Cadastrar Usuario            ]              |
+----------------------------------------------------------+
```

### Comportamento dos Dropdowns

1. **Empresa** -> Ao selecionar, carrega Setores e Cargos daquela empresa
2. **Setor** -> Desabilitado ate selecionar empresa
3. **Cargo** -> Desabilitado ate selecionar empresa
4. Se trocar de empresa -> Limpa setor e cargo selecionados

---

## 6. Sistema de Login por Username

### Tela de Login Atualizada

```text
+------------------------------------------+
|             AcertaMais                   |
|   Gerencie suas tarefas de forma simples |
+------------------------------------------+
| Usuario                                  |
| [________________________]               |
|                                          |
| Senha                                    |
| [________________________]               |
|                                          |
| [           Entrar           ]           |
+------------------------------------------+
```

### Fluxo de Autenticacao

```text
Usuario digita: username + senha
         |
         v
Sistema chama funcao get_email_by_username
         |
         v
Se encontrado E is_active = true:
  - Autentica via Supabase Auth
  - Redireciona para home
         |
Se nao encontrado OU is_active = false:
  - Exibe erro: "Usuario nao encontrado ou inativo"
```

---

## 7. Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/migrations/xxx_companies_system.sql` | Criar | Migracao completa |
| `src/hooks/useCompanies.ts` | Criar | Hook para empresas, setores e cargos |
| `src/components/companies/CompanyManagement.tsx` | Criar | CRUD de empresas com setores e cargos |
| `src/components/users/UserRegistrationForm.tsx` | Reescrever | Novo formulario com todos os campos |
| `src/pages/AuthPage.tsx` | Modificar | Login por username |
| `src/contexts/AuthContext.tsx` | Modificar | Logica de autenticacao por username |
| `src/pages/UsersPage.tsx` | Modificar | Nova aba "Empresas" (substituir "Setores") |
| `src/components/ProtectedRoute.tsx` | Modificar | Verificar is_active |
| `src/hooks/useSectors.ts` | Modificar | Adicionar filtro por company_id |
| `src/components/sectors/SectorManagement.tsx` | Remover/Integrar | Setores agora no cadastro de empresas |

---

## 8. Hook useCompanies

```typescript
interface Company {
  id: string;
  name: string;
  sectors?: Sector[];
  positions?: CompanyPosition[];
}

interface Sector {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
}

interface CompanyPosition {
  id: string;
  company_id: string;
  name: string;
}

// Funcoes do hook:
// - fetchCompanies() - Lista empresas com setores e cargos
// - addCompany(name, sectors[], positions[]) - Cria empresa completa
// - updateCompany(id, name, sectors[], positions[]) - Atualiza empresa
// - deleteCompany(id) - Remove empresa
// - fetchSectorsByCompany(companyId) - Lista setores de uma empresa
// - fetchPositionsByCompany(companyId) - Lista cargos de uma empresa
```

---

## 9. Fluxo de Criacao de Usuario

```text
God Mode acessa "Gerenciar Usuarios"
         |
         v
Clica na aba "Cadastrar"
         |
         v
Preenche: username, senha, funcao
         |
         v
Seleciona empresa
   -> Sistema carrega setores e cargos da empresa
         |
         v
Seleciona setor e cargo
         |
         v
Define se esta ativo
         |
         v
Clica em "Cadastrar"
         |
         v
Sistema cria usuario no Auth com email interno:
{username}@internal.acertamais.app
         |
         v
Atualiza profile com:
- username, company_id, position_id, is_active
         |
         v
Vincula usuario ao setor (profile_sectors)
         |
         v
Define role na tabela user_roles
         |
         v
Usuario pode fazer login com username
```

---

## 10. Impacto nas Funcionalidades Existentes

### Tarefas por Setor

As tarefas ja usam `sector_id`. Como setores agora tem `company_id`, a filtragem de tarefas por setor continua funcionando. Apenas a gestao de setores muda (agora via cadastro de empresas).

### Funcoes de Banco de Dados

As funcoes `get_user_sector_ids` e `is_sector_manager` continuam funcionando, pois o setor ainda e a mesma tabela, apenas com o campo `company_id` adicional.

### Templates de Tarefas

A tabela `task_templates` usa `sector_id`, que continua existindo. Funciona normalmente.

---

## 11. Permissoes

### Empresas, Setores e Cargos

| Role | Visualizar | Criar | Editar | Excluir |
|------|------------|-------|--------|---------|
| user | - | - | - | - |
| gestor_setor | - | - | - | - |
| gestor_geral | - | - | - | - |
| task_editor | - | - | - | - |
| admin | Sim | - | - | - |
| god_mode | Sim | Sim | Sim | Sim |

### Cadastro de Usuarios

Apenas `god_mode` pode cadastrar novos usuarios.

---

## 12. Abas na Pagina de Usuarios (Novo Layout)

```text
+------------------------------------------------------------+
| Gerenciar Usuarios                                         |
+------------------------------------------------------------+
| [Usuarios] [Empresas] [Cadastrar]                         |
+------------------------------------------------------------+
```

A aba "Setores" e removida, pois setores agora sao gerenciados dentro do cadastro de cada empresa.

---

## 13. Validacoes

### Username
- 3-50 caracteres
- Apenas letras, numeros e underscore
- Unico no sistema

### Senha
- Minimo 6 caracteres

### Empresa/Setor/Cargo
- Todos obrigatorios no cadastro

---

## 14. Resultado Esperado

1. **Empresas centralizadas** - Cada empresa tem seus setores e cargos
2. **Login por username** - Mais simples que email
3. **Dropdowns dinamicos** - Setor e cargo filtram pela empresa
4. **Controle de acesso** - Usuarios inativos bloqueados automaticamente
5. **Cadastro centralizado** - Apenas god_mode cria usuarios
6. **Integracao mantida** - Tarefas continuam funcionando com sector_id
