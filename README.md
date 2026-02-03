# Acerta Express - Dashboard de Gestão e Gamificação

![Acerta Express Banner](public/og-image.png)

Sistema completo de gestão de tarefas, acompanhamento de empresas e gamificação corporativa, desenvolvido para otimizar a produtividade e o engajamento das equipes da Acerta Express.

## 🚀 Funcionalidades Principais

### 🎮 Gamificação e Tarefas
- **Sistema de Pontos e Níveis**: Usuários ganham XP ao concluir tarefas, subindo de nível e desbloqueando conquistas.
- **Ranking (Leaderboard)**: Visualização competitiva dos colaboradores com maior desempenho.
- **Tarefas Dinâmicas**: Criação de tarefas com checklists, prazos, criticidade e atribuição a usuários ou setores.
- **Templates de Tarefas**: Modelos reutilizáveis para processos recorrentes.

### 🛡️ Controle de Acesso (RBAC)
O sistema possui um robusto controle de permissões baseado em papéis:
- **God Mode**: Acesso irrestrito a todo o sistema (CRUD total, gestão de usuários, verificação de todas as tarefas).
- **Admin**: Gestão completa de usuários e configurações.
- **Gestor Geral**: Visão ampla de todas as tarefas e métricas.
- **Gestor de Setor**: Controle total sobre as tarefas e membros do seu setor.
- **User**: Foco na execução de tarefas atribuídas.

### 📊 Gestão Corporativa
- **Cadastro de Empresas e Setores**: Organização hierárquica dos colaboradores.
- **Monitoramento em Tempo Real**: Filtros avançados para acompanhar tarefas pendentes, em progresso e concluídas.
- **Relatórios de Permissões**: Matriz visual de acessos disponível para super usuários.

## 🛠️ Stack Tecnológica

O projeto utiliza as tecnologias mais modernas do ecossistema React:

- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) - Performance e DX superior.
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) - Tipagem estática para maior segurança.
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) - Design System premium e responsivo.
- **Backend & Auth**: [Supabase](https://supabase.com/) - Banco de dados Postgres, Autenticação e Real-time.
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) - Gerenciamento eficiente de estado assíncrono.
- **Automação**: [n8n](https://n8n.io/) - Workflows de integração e alertas (Webhooks).

## 🐳 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose (Opcional, para deploy)

### Desenvolvimento Local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/tasks-acerta.git
   cd tasks-acerta
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_key_supabase
   VITE_WHATSAPP_WEBHOOK_URL=sua_url_webhook
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

### Deploy com Docker

Para subir a aplicação em produção usando Docker:

```bash
docker-compose up -d --build
```

A aplicação estará disponível na porta definida (padrão `80` ou `8080`).

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes Reutilizáveis (UI, Tasks, Users)
├── contexts/       # Contextos React (Auth, Theme)
├── hooks/          # Hooks Customizados (useUserRole, useTasks)
├── pages/          # Rotas da Aplicação
├── integrations/   # Clientes de serviços externos (Supabase)
└── lib/            # Utilitários e configurações
```

## 🔒 Permissões e Segurança

A segurança é garantida via **Row Level Security (RLS)** no Postgres.
Todas as ações sensíveis (como alterar papéis ou concluir tarefas de terceiros) são validadas tanto no Frontend quanto no Backend via Policies e RPC Functions seguras.

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/NovaFeature`)
3. Faça o Commit de suas mudanças (`git commit -m 'Add some NovaFeature'`)
4. Faça o Push para a Branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

---

Desenvolvido para **Acerta Express**.
