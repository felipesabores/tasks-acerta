import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Medal, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserPerformance {
  profileId: string;
  name: string;
  totalPoints: number;
  tasksCompleted: number;
  tasksNotCompleted: number;
  tasksNoDemand: number;
  completionRate: number;
  trend: number;
}

interface UserRankingTableProps {
  users: UserPerformance[];
}

function getRankIcon(position: number) {
  switch (position) {
    case 0:
      return <Crown className="h-5 w-5 text-amber-500" />;
    case 1:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 2:
      return <Medal className="h-5 w-5 text-amber-700" />;
    default:
      return (
        <span className="text-sm font-bold text-muted-foreground w-5 text-center">
          {position + 1}
        </span>
      );
  }
}

function getTrendIcon(trend: number) {
  if (trend > 0) {
    return (
      <div className="flex items-center gap-1 text-emerald-500">
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs font-medium">+{trend}%</span>
      </div>
    );
  }
  if (trend < 0) {
    return (
      <div className="flex items-center gap-1 text-rose-500">
        <TrendingDown className="h-4 w-4" />
        <span className="text-xs font-medium">{trend}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span className="text-xs font-medium">0%</span>
    </div>
  );
}

export function UserRankingTable({ users }: UserRankingTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          Ranking de Desempenho
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-center">Pontos</TableHead>
                <TableHead className="text-center">Concluídas</TableHead>
                <TableHead className="text-center">Não Concluídas</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="text-center">Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow
                  key={user.profileId}
                  className={cn(
                    'border-border transition-colors',
                    index === 0 && 'bg-amber-500/5',
                    index === 1 && 'bg-slate-500/5',
                    index === 2 && 'bg-amber-700/5'
                  )}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                        <AvatarFallback
                          className={cn(
                            'text-xs font-semibold',
                            index === 0 && 'bg-amber-500/20 text-amber-600',
                            index === 1 && 'bg-slate-500/20 text-slate-600',
                            index === 2 && 'bg-amber-700/20 text-amber-700',
                            index > 2 && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-bold tabular-nums',
                        index === 0 && 'border-amber-500/50 bg-amber-500/10 text-amber-600',
                        index > 0 && 'border-primary/50 bg-primary/10 text-primary'
                      )}
                    >
                      {user.totalPoints.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-emerald-500 font-medium tabular-nums">
                      {user.tasksCompleted}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-rose-500 font-medium tabular-nums">
                      {user.tasksNotCompleted}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <div
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-semibold',
                          user.completionRate >= 80 && 'bg-emerald-500/10 text-emerald-500',
                          user.completionRate >= 50 && user.completionRate < 80 && 'bg-amber-500/10 text-amber-500',
                          user.completionRate < 50 && 'bg-rose-500/10 text-rose-500'
                        )}
                      >
                        {user.completionRate}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getTrendIcon(user.trend)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
