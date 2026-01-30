import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileDown, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ReportSection, ReportTable, ReportBadge } from '@/components/report/ReportSection';
import { useExecutiveReport } from '@/hooks/useExecutiveReport';
import { Skeleton } from '@/components/ui/skeleton';

const LOGO_URL = "https://iteasvfrtzlzxifvnpkk.supabase.co/storage/v1/object/public/logos//acerta mais azul.png";

export default function ExecutiveReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data, isLoading } = useExecutiveReport();

  const generatePDF = async () => {
    if (!reportRef.current) return;

    setIsGenerating(true);

    try {
      const element = reportRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('relatorio-executivo-acertamais.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Relatório Executivo">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  const roleLabels: Record<string, string> = {
    god_mode: 'God Mode',
    admin: 'Administrador',
    task_editor: 'Editor de Tarefas',
    gestor_setor: 'Gestor de Setor',
    gestor_geral: 'Gestor Geral',
    user: 'Usuário',
  };

  return (
    <AppLayout title="Relatório Executivo">
      <div className="mb-6 flex justify-end print:hidden">
        <Button onClick={generatePDF} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </>
          )}
        </Button>
      </div>

      {/* Report Content */}
      <div
        ref={reportRef}
        className="bg-white text-gray-900 p-8 max-w-4xl mx-auto shadow-lg print:shadow-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <header className="text-center mb-8 pb-6 border-b-2 border-blue-600">
          <img src={LOGO_URL} alt="AcertaMais" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-blue-800">
            Relatório Executivo - Sistema AcertaMais
          </h1>
          <p className="text-gray-600 mt-2">
            Gerado em {data?.generatedAt ? format(data.generatedAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
          </p>
        </header>

        {/* Section 1: Overview */}
        <ReportSection number={1} title="Visão Geral do Sistema">
          <p className="mb-4">
            O <strong>AcertaMais</strong> é um sistema de gestão de tarefas diárias com gamificação, 
            ranking de desempenho e controle hierárquico de acesso. A arquitetura foi modernizada 
            para utilizar <strong>Empresas como entidade central</strong>, vinculando setores, 
            cargos e usuários de forma hierárquica.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
            <div className="bg-blue-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-blue-600">{data?.companies.length || 0}</div>
              <div className="text-sm text-gray-600">Empresas</div>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-green-600">{data?.users.length || 0}</div>
              <div className="text-sm text-gray-600">Usuários</div>
            </div>
            <div className="bg-purple-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-purple-600">{data?.taskStats.total || 0}</div>
              <div className="text-sm text-gray-600">Tarefas</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded text-center">
              <div className="text-2xl font-bold text-yellow-600">{data?.totalPoints || 0}</div>
              <div className="text-sm text-gray-600">Pontos Totais</div>
            </div>
          </div>
        </ReportSection>

        {/* Section 2: Architecture */}
        <ReportSection number={2} title="Arquitetura e Modelo de Dados">
          <p className="mb-4">Estrutura hierárquica do sistema:</p>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm mb-4">
            <pre>{`EMPRESA (entidade central)
   │
   ├──► SETORES (vinculados à empresa)
   │
   └──► CARGOS (vinculados à empresa)

USUÁRIO
   │
   ├──► username (login)
   ├──► company_id (empresa)
   ├──► position_id (cargo)
   ├──► sector (via profile_sectors)
   └──► is_active (status da conta)`}</pre>
          </div>
          <ReportTable
            headers={['Tabela', 'Descrição']}
            rows={[
              ['companies', 'Empresas cadastradas no sistema'],
              ['sectors', 'Setores vinculados às empresas'],
              ['company_positions', 'Cargos vinculados às empresas'],
              ['profiles', 'Perfis de usuários (nome, username, whatsapp, empresa, cargo, status)'],
              ['profile_sectors', 'Vínculo entre usuários e setores'],
              ['user_roles', 'Papéis de acesso dos usuários'],
              ['tasks', 'Tarefas do sistema'],
              ['task_templates', 'Modelos de tarefas reutilizáveis'],
              ['daily_task_completions', 'Registro de conclusão diária de tarefas'],
              ['user_points', 'Pontuação acumulada dos usuários'],
              ['criticality_points', 'Configuração de pontos por criticidade'],
              ['admin_alerts', 'Alertas para gestores'],
            ]}
          />
        </ReportSection>

        {/* Section 3: RBAC */}
        <ReportSection number={3} title="Papéis de Acesso (RBAC)">
          <ReportTable
            headers={['Papel', 'Descrição', 'Permissões']}
            rows={[
              ['god_mode', 'Supervisão total', 'Acesso completo + Painel de KPIs avançado'],
              ['admin', 'Administrador', 'Gestão de usuários e tarefas globais'],
              ['task_editor', 'Editor de Tarefas', 'Criar/editar tarefas (sem excluir)'],
              ['gestor_setor', 'Gestor de Setor', 'Gerencia tarefas do seu setor específico'],
              ['gestor_geral', 'Gestor Geral', 'Visualiza todas as tarefas (somente leitura)'],
              ['user', 'Usuário comum', 'Executa tarefas diárias atribuídas'],
            ]}
          />
        </ReportSection>

        {/* Section 4: Current Data */}
        <ReportSection number={4} title="Dados Atuais do Sistema">
          <h3 className="font-semibold mb-2">4.1 Empresas Cadastradas</h3>
          <ReportTable
            headers={['Empresa', 'Setores', 'Cargos']}
            rows={(data?.companies || []).map(c => [c.name, String(c.sectorsCount), String(c.positionsCount)])}
          />

          <h3 className="font-semibold mb-2 mt-6">4.2 Usuários</h3>
          <ReportTable
            headers={['Usuário', 'Username', 'Empresa', 'Cargo', 'Papel', 'Status']}
            rows={(data?.users || []).map(u => [
              u.name,
              u.username || '-',
              u.company || '-',
              u.position || '-',
              <ReportBadge key={u.id}>{roleLabels[u.role || 'user']}</ReportBadge>,
              u.isActive 
                ? <ReportBadge variant="success">Ativo</ReportBadge> 
                : <ReportBadge variant="error">Inativo</ReportBadge>,
            ])}
          />

          <h3 className="font-semibold mb-2 mt-6">4.3 Tarefas por Status</h3>
          <ReportTable
            headers={['Status', 'Quantidade']}
            rows={[
              ['Pendentes', String(data?.taskStats.pending || 0)],
              ['Em Progresso', String(data?.taskStats.inProgress || 0)],
              ['Concluídas', String(data?.taskStats.done || 0)],
            ]}
          />

          <h3 className="font-semibold mb-2 mt-6">4.4 Tarefas por Criticidade</h3>
          <ReportTable
            headers={['Criticidade', 'Quantidade']}
            rows={[
              [<ReportBadge key="critical" variant="error">Crítica</ReportBadge>, String(data?.taskStats.byCriticality.critical || 0)],
              [<ReportBadge key="high" variant="warning">Alta</ReportBadge>, String(data?.taskStats.byCriticality.high || 0)],
              ['Média', String(data?.taskStats.byCriticality.medium || 0)],
              ['Baixa', String(data?.taskStats.byCriticality.low || 0)],
            ]}
          />
        </ReportSection>

        {/* Section 5: Use Cases */}
        <ReportSection number={5} title="Casos de Uso Principais">
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC01: Login no Sistema</h4>
              <p className="text-gray-600">Autenticação via username com verificação de status ativo.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC02: Cadastrar Empresa</h4>
              <p className="text-gray-600">god_mode pode criar empresas com setores e cargos em uma única tela.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC03: Cadastrar Usuário</h4>
              <p className="text-gray-600">Cadastro com nome, username, senha, WhatsApp, empresa, setor, cargo e função.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC04: Editar Usuário</h4>
              <p className="text-gray-600">Dialog completo com dropdowns em cascata para empresa, setor e cargo.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC05: Criar Tarefa</h4>
              <p className="text-gray-600">Título, descrição obrigatória, criticidade, atribuição e checklist opcional.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC06: Finalizar Tarefa Diária</h4>
              <p className="text-gray-600">Usuário pode marcar como Concluída, Não concluída ou Sem demanda.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC07: Visualizar Painel God Mode</h4>
              <p className="text-gray-600">KPIs avançados, gráficos e filtros de período para supervisão total.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">UC08: Gerenciar Templates de Tarefas</h4>
              <p className="text-gray-600">Modelos reutilizáveis por setor para clonagem automática diária.</p>
            </div>
          </div>
        </ReportSection>

        {/* Section 6: Identified Issues */}
        <ReportSection number={6} title="Problemas Identificados">
          <ReportTable
            headers={['Problema', 'Impacto', 'Prioridade']}
            rows={[
              ['Usuários legados sem username', 'Não conseguem fazer login pelo fluxo novo', <ReportBadge key="1" variant="error">Alta</ReportBadge>],
              ['Usuários sem empresa vinculada', 'Dados incompletos na listagem', <ReportBadge key="2" variant="warning">Média</ReportBadge>],
              ['Campo cargo duplicado (texto + FK)', 'Inconsistência de dados', <ReportBadge key="3" variant="warning">Média</ReportBadge>],
            ]}
          />
        </ReportSection>

        {/* Section 7: Suggested Improvements */}
        <ReportSection number={7} title="Melhorias Sugeridas">
          <h3 className="font-semibold mb-2">Alta Prioridade</h3>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Migrar dados legados de usuários sem username/empresa/cargo</li>
            <li>Remover campo <code className="bg-gray-200 px-1 rounded">cargo</code> texto duplicado</li>
            <li>Validar username único em tempo real no cadastro</li>
            <li>Adicionar filtros na listagem de usuários</li>
          </ul>

          <h3 className="font-semibold mb-2">Média Prioridade</h3>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li>Reset de senha via email</li>
            <li>Histórico de alterações em perfis</li>
            <li>Exportação de dados em CSV</li>
            <li>Dashboard específico por setor</li>
          </ul>

          <h3 className="font-semibold mb-2">Baixa Prioridade</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Notificações via WhatsApp</li>
            <li>Aplicativo mobile</li>
            <li>Gamificação avançada (conquistas, níveis)</li>
            <li>Relatórios em PDF personalizados</li>
          </ul>
        </ReportSection>

        {/* Section 8: Executive Summary */}
        <ReportSection number={8} title="Resumo Executivo">
          <ReportTable
            headers={['Aspecto', 'Status', 'Observações']}
            rows={[
              ['Autenticação por username', <ReportBadge key="1" variant="success">Implementado</ReportBadge>, 'Função RPC + verificação is_active'],
              ['Gestão de Empresas', <ReportBadge key="2" variant="success">Implementado</ReportBadge>, 'CRUD completo com setores e cargos'],
              ['Cadastro de Usuários', <ReportBadge key="3" variant="success">Implementado</ReportBadge>, 'Dropdowns em cascata, todos os campos'],
              ['Edição de Usuários', <ReportBadge key="4" variant="success">Implementado</ReportBadge>, 'Dialog completo, nova arquitetura'],
              ['Sistema de Tarefas', <ReportBadge key="5" variant="success">Implementado</ReportBadge>, 'Criticidade, pontuação, checklist, templates'],
              ['Gamificação', <ReportBadge key="6" variant="success">Implementado</ReportBadge>, 'Pontuação e ranking horizontal/vertical'],
              ['Painel God Mode', <ReportBadge key="7" variant="success">Implementado</ReportBadge>, 'KPIs avançados, gráficos, filtros'],
              ['Dados Legados', <ReportBadge key="8" variant="warning">Pendente</ReportBadge>, 'Migração de usuários antigos necessária'],
            ]}
          />
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="font-semibold text-blue-800">Conclusão:</p>
            <p className="text-blue-700 mt-2">
              O sistema AcertaMais está funcional com todas as principais funcionalidades implementadas. 
              A arquitetura centralizada em Empresas foi aplicada com sucesso. Os pontos de atenção 
              são a migração de dados legados e a remoção do campo cargo texto duplicado.
            </p>
          </div>
        </ReportSection>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t text-center text-gray-500 text-sm">
          <p>AcertaMais © {new Date().getFullYear()} - Todos os direitos reservados</p>
          <p className="mt-1">Relatório gerado automaticamente pelo sistema</p>
        </footer>
      </div>
    </AppLayout>
  );
}
