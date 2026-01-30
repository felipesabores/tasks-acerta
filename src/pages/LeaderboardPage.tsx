import { AppLayout } from '@/components/layout/AppLayout';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { CriticalityPointsTable } from '@/components/users/CriticalityPointsTable';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function LeaderboardPage() {
  const { isAdmin } = useUserRole();

  return (
    <AppLayout title="Ranking de Pontuação">
      <div className="space-y-6">
        <Leaderboard />
        
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração de Pontuação
              </CardTitle>
              <CardDescription>
                Configure os pontos padrão de acordo com o grau de criticidade da tarefa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CriticalityPointsTable />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
