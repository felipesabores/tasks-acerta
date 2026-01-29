import { AppLayout } from '@/components/layout/AppLayout';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';

export default function LeaderboardPage() {
  return (
    <AppLayout title="Ranking de Pontuação">
      <Leaderboard />
    </AppLayout>
  );
}
