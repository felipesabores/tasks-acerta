import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HorizontalLeaderboard() {
  const { leaderboard, loading, currentUserRank } = useLeaderboard();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
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
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-destructive/20 text-destructive text-xs">
          <AlertCircle className="h-3 w-3" />
        </div>
      );
    }
    if (rank <= 3 && rank > 0) {
      return (
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg text-xs",
          getMedalStyles(rank)
        )}>
          <Medal className="h-3 w-3" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-muted text-muted-foreground text-xs">
        {rank}
      </div>
    );
  };

  // Separate active and pending users
  const activeUsers = leaderboard.filter(e => !e.isPending);
  const pendingUsers = leaderboard.filter(e => e.isPending);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking de Pontuação
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-4">
        {activeUsers.length === 0 && pendingUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum ponto registrado ainda.
          </p>
        ) : (
          <>
            {/* Active Users */}
            {activeUsers.length > 0 && (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-3 pb-2">
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
                          "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors min-w-[100px]",
                          isCurrentUser ? "bg-primary/10 border-2 border-primary/30" : "bg-muted/50 border border-transparent",
                          entry.rank <= 3 && "border-b-4",
                          entry.rank === 1 && "border-b-yellow-400",
                          entry.rank === 2 && "border-b-gray-300",
                          entry.rank === 3 && "border-b-amber-600"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {getRankDisplay(entry.rank, entry.isPending)}
                        </div>

                        <Avatar className="h-10 w-10">
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

                        <div className="text-center">
                          <p className={cn(
                            "font-medium text-sm truncate max-w-[80px]",
                            isCurrentUser && "text-primary"
                          )}>
                            {entry.profile.name.split(' ')[0]}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[10px] text-primary font-medium">(você)</span>
                          )}
                        </div>

                        <div className="text-center">
                          <p className={cn(
                            "font-bold text-lg",
                            entry.rank === 1 && "text-yellow-600",
                            entry.rank === 2 && "text-gray-600",
                            entry.rank === 3 && "text-amber-700",
                            entry.rank > 3 && "text-foreground"
                          )}>
                            {entry.total_points}
                          </p>
                          <p className="text-[10px] text-muted-foreground">pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}

            {/* Pending Users */}
            {pendingUsers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span>Pendentes</span>
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-2">
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
                            "flex flex-col items-center gap-1.5 p-2 rounded-lg min-w-[80px] opacity-60",
                            isCurrentUser ? "bg-destructive/10 border border-destructive/30" : "bg-muted/30 border border-dashed border-muted"
                          )}
                        >
                          {getRankDisplay(entry.rank, entry.isPending)}

                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.profile.avatar_url || ''} />
                            <AvatarFallback className="font-medium text-xs bg-muted">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="text-center">
                            <p className={cn(
                              "text-xs truncate max-w-[70px]",
                              isCurrentUser && "text-destructive"
                            )}>
                              {entry.profile.name.split(' ')[0]}
                            </p>
                            <Badge variant="outline" className="text-[8px] px-1 py-0 text-destructive border-destructive/30">
                              Pendente
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
