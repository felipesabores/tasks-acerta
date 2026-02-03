import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Loader2, AlertCircle } from 'lucide-react';
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

  const getRankDisplay = (rank: number, isPending: boolean) => {
    if (isPending) {
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
        </div>
      );
    }
    if (rank <= 3 && rank > 0) {
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

  // Separate active and pending users
  const activeUsers = leaderboard.filter(e => !e.isPending);
  const pendingUsers = leaderboard.filter(e => e.isPending);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking de Pontuação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeUsers.length === 0 && pendingUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum ponto registrado ainda.
          </p>
        ) : (
          <>
            {/* Active Users */}
            {activeUsers.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeUsers.map((entry) => {
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
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/50",
                        entry.rank <= 3 && "border-l-4",
                        entry.rank === 1 && "border-l-yellow-400",
                        entry.rank === 2 && "border-l-gray-300",
                        entry.rank === 3 && "border-l-amber-600"
                      )}
                    >
                      {getRankDisplay(entry.rank, entry.isPending)}

                      <Avatar className="h-9 w-9">
                        <AvatarImage src={entry.profile.avatar_url || ''} />
                        <AvatarFallback className={cn(
                          "font-medium text-sm",
                          entry.rank === 1 && "bg-yellow-100 text-yellow-800",
                          entry.rank === 2 && "bg-gray-100 text-gray-800",
                          entry.rank === 3 && "bg-amber-100 text-amber-800"
                        )}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className={cn(
                            "font-medium text-sm truncate",
                            isCurrentUser && "text-primary"
                          )}>
                            {entry.profile.name}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-primary font-medium">(você)</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {entry.tasks_completed} ✓ • {entry.tasks_not_completed} ✗
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          entry.rank === 1 && "text-yellow-600",
                          entry.rank === 2 && "text-gray-600",
                          entry.rank === 3 && "text-amber-700",
                          entry.rank > 3 && "text-foreground"
                        )}>
                          {entry.total_points}
                        </p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending Users Section */}
            {pendingUsers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span>Usuários com pendências (fora do ranking)</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pendingUsers.map((entry) => {
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
                          "flex items-center gap-3 p-3 rounded-lg transition-colors opacity-60",
                          isCurrentUser ? "bg-destructive/10 border border-destructive/20" : "bg-muted/30 border border-dashed border-destructive/30"
                        )}
                      >
                        {getRankDisplay(entry.rank, entry.isPending)}

                        <Avatar className="h-9 w-9">
                          <AvatarImage src={entry.profile.avatar_url || ''} />
                          <AvatarFallback className="font-medium text-sm bg-muted">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className={cn(
                              "font-medium text-sm truncate",
                              isCurrentUser && "text-destructive"
                            )}>
                              {entry.profile.name}
                            </p>
                            {isCurrentUser && (
                              <span className="text-xs text-destructive font-medium">(você)</span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 mt-1">
                            Pendente
                          </Badge>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-muted-foreground">
                            {entry.total_points}
                          </p>
                          <p className="text-xs text-muted-foreground">pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
