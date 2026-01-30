import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CompanyData {
  id: string;
  name: string;
  sectorsCount: number;
  positionsCount: number;
}

interface UserData {
  id: string;
  name: string;
  username: string | null;
  company: string | null;
  position: string | null;
  role: string | null;
  isActive: boolean;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  byCriticality: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface ReportData {
  companies: CompanyData[];
  users: UserData[];
  taskStats: TaskStats;
  totalPoints: number;
  generatedAt: Date;
}

export function useExecutiveReport() {
  return useQuery({
    queryKey: ['executive-report'],
    queryFn: async (): Promise<ReportData> => {
      // Fetch companies with counts
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name');

      const { data: sectors } = await supabase
        .from('sectors')
        .select('id, company_id');

      const { data: positions } = await supabase
        .from('company_positions')
        .select('id, company_id');

      const companiesData: CompanyData[] = (companies || []).map(company => ({
        id: company.id,
        name: company.name,
        sectorsCount: (sectors || []).filter(s => s.company_id === company.id).length,
        positionsCount: (positions || []).filter(p => p.company_id === company.id).length,
      }));

      // Fetch users with their data
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          username,
          is_active,
          company_id,
          position_id
        `);

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const { data: companiesList } = await supabase
        .from('companies')
        .select('id, name');

      const { data: positionsList } = await supabase
        .from('company_positions')
        .select('id, name');

      const usersData: UserData[] = (profiles || []).map(profile => {
        const company = (companiesList || []).find(c => c.id === profile.company_id);
        const position = (positionsList || []).find(p => p.id === profile.position_id);
        const role = (userRoles || []).find(r => r.user_id === profile.id);

        return {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          company: company?.name || null,
          position: position?.name || null,
          role: role?.role || 'user',
          isActive: profile.is_active,
        };
      });

      // Fetch task stats
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, criticality')
        .eq('is_template', false);

      const taskStats: TaskStats = {
        total: (tasks || []).length,
        pending: (tasks || []).filter(t => t.status === 'pending').length,
        inProgress: (tasks || []).filter(t => t.status === 'in_progress').length,
        done: (tasks || []).filter(t => t.status === 'done').length,
        byCriticality: {
          critical: (tasks || []).filter(t => t.criticality === 'critical').length,
          high: (tasks || []).filter(t => t.criticality === 'high').length,
          medium: (tasks || []).filter(t => t.criticality === 'medium').length,
          low: (tasks || []).filter(t => t.criticality === 'low').length,
        },
      };

      // Fetch total points
      const { data: points } = await supabase
        .from('user_points')
        .select('total_points');

      const totalPoints = (points || []).reduce((sum, p) => sum + p.total_points, 0);

      return {
        companies: companiesData,
        users: usersData,
        taskStats,
        totalPoints,
        generatedAt: new Date(),
      };
    },
  });
}
