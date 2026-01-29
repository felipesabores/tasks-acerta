import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trophy, Medal, Loader2 } from 'lucide-react';
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

  const getRankDisplay = (rank: number) => {
    if (rank <= 3) {
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking de Pontuação
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum ponto registrado ainda.
          </p>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
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
                      "flex flex-col items-center gap-2 p-3 rounded-lg transition-colors min-w-[100px]",
                      isCurrentUser ? "bg-primary/10 border-2 border-primary/30" : "bg-muted/50 border border-transparent",
                      entry.rank <= 3 && "border-b-4",
                      entry.rank === 1 && "border-b-yellow-400",
                      entry.rank === 2 && "border-b-gray-300",
                      entry.rank === 3 && "border-b-amber-600"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {getRankDisplay(entry.rank)}
                    </div>
                    
                    <Avatar className="h-10 w-10">
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
      </CardContent>
    </Card>
  );
}
