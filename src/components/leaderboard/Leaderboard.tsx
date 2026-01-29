import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Leaderboard() {
  const { leaderboard, loading, currentUserRank, getMedalColor } = useLeaderboard();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const getMedalStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400 text-yellow-900 shadow-yellow-400/50';
      case 2:
        return 'bg-gray-300 text-gray-700 shadow-gray-300/50';
      case 3:
        return 'bg-amber-600 text-amber-100 shadow-amber-600/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank <= 3) {
      return (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg",
          getMedalStyles(rank)
        )}>
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-muted text-muted-foreground">
        {rank}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking de Pontuação
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum ponto registrado ainda.
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {leaderboard.map((entry) => {
                const isCurrentUser = currentUserRank?.profile_id === entry.profile_id;
                const initials = entry.profile.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg transition-colors",
                      isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/50",
                      entry.rank <= 3 && "border-l-4",
                      entry.rank === 1 && "border-l-yellow-400",
                      entry.rank === 2 && "border-l-gray-300",
                      entry.rank === 3 && "border-l-amber-600"
                    )}
                  >
                    {getRankDisplay(entry.rank)}
                    
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn(
                        "font-medium",
                        entry.rank === 1 && "bg-yellow-100 text-yellow-800",
                        entry.rank === 2 && "bg-gray-100 text-gray-800",
                        entry.rank === 3 && "bg-amber-100 text-amber-800"
                      )}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "font-medium truncate",
                          isCurrentUser && "text-primary"
                        )}>
                          {entry.profile.name}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-primary font-medium">(você)</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.tasks_completed} concluídas • {entry.tasks_not_completed} não concluídas
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-lg",
                        entry.rank === 1 && "text-yellow-600",
                        entry.rank === 2 && "text-gray-600",
                        entry.rank === 3 && "text-amber-700",
                        entry.rank > 3 && "text-foreground"
                      )}>
                        {entry.total_points}
                      </p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
