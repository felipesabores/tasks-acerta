import { AppLayout } from '@/components/layout/AppLayout';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { CriticalityPointsTable } from '@/components/users/CriticalityPointsTable';
import { PageHeader } from '@/components/ui/page-header';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Settings } from 'lucide-react';

export default function LeaderboardPage() {
  const { isAdmin } = useUserRole();

  return (
    <AppLayout title="Ranking de Pontuação">
      <div className="space-y-6">
        <PageHeader
          title="Ranking de Pontuação"
          subtitle="Acompanhe a performance da equipe e veja quem está no topo"
          icon={Trophy}
          variant="warning"
        />

        <LeaderboardTable />

        {isAdmin && (
          <Card className="border-muted/50 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
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
