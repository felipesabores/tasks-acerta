import { useLeaderboard } from '@/hooks/useLeaderboard';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Medal, Trophy, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function LeaderboardTable() {
    const { leaderboard, loading } = useLeaderboard();

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        Ranking de Desempenho
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    // Separate active and pending users
    const activeUsers = leaderboard.filter(e => !e.isPending);
    const pendingUsers = leaderboard.filter(e => e.isPending);

    return (
        <Card className="border-muted/50">
            <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Trophy className="h-5 w-5 text-white" />
                    </div>
                    Ranking de Desempenho
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {activeUsers.length === 0 && pendingUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Nenhum ponto registrado ainda.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead className="text-center">Pontos</TableHead>
                                    <TableHead className="text-center">Concluídas</TableHead>
                                    <TableHead className="text-center">Não Concluídas</TableHead>
                                    <TableHead className="text-center">Taxa</TableHead>
                                    <TableHead className="text-center">Tendência</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeUsers.map((entry, index) => {
                                    const completionRate = entry.tasks_completed + entry.tasks_not_completed > 0
                                        ? Math.round((entry.tasks_completed / (entry.tasks_completed + entry.tasks_not_completed)) * 100)
                                        : 0;

                                    return (
                                        <TableRow
                                            key={entry.id}
                                            className={cn(
                                                'transition-colors',
                                                index === 0 && 'bg-amber-500/5 hover:bg-amber-500/10',
                                                index === 1 && 'bg-slate-500/5 hover:bg-slate-500/10',
                                                index === 2 && 'bg-amber-700/5 hover:bg-amber-700/10'
                                            )}
                                        >
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    {getRankIcon(index)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                                        <AvatarImage src={entry.profile.avatar_url || ''} />
                                                        <AvatarFallback
                                                            className={cn(
                                                                'text-xs font-semibold',
                                                                index === 0 && 'bg-amber-500/20 text-amber-600',
                                                                index === 1 && 'bg-slate-500/20 text-slate-600',
                                                                index === 2 && 'bg-amber-700/20 text-amber-700',
                                                                index > 2 && 'bg-muted text-muted-foreground'
                                                            )}
                                                        >
                                                            {getInitials(entry.profile.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{entry.profile.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'font-semibold',
                                                        index === 0 && 'border-amber-500/50 bg-amber-500/10 text-amber-600',
                                                        index === 1 && 'border-slate-500/50 bg-slate-500/10 text-slate-600',
                                                        index === 2 && 'border-amber-700/50 bg-amber-700/10 text-amber-700'
                                                    )}
                                                >
                                                    {entry.total_points}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-emerald-600 font-medium">
                                                    {entry.tasks_completed}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-red-600 font-medium">
                                                    {entry.tasks_not_completed}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={completionRate === 100 ? 'default' : 'secondary'}
                                                    className={cn(
                                                        completionRate === 100 && 'bg-emerald-500 hover:bg-emerald-600'
                                                    )}
                                                >
                                                    {completionRate}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-emerald-600 text-sm font-medium">
                                                    +8%
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {/* Pending Users Section */}
                                {pendingUsers.length > 0 && (
                                    <>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={7} className="py-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="font-medium">Pendentes</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {pendingUsers.map((entry) => {
                                            const completionRate = entry.tasks_completed + entry.tasks_not_completed > 0
                                                ? Math.round((entry.tasks_completed / (entry.tasks_completed + entry.tasks_not_completed)) * 100)
                                                : 0;

                                            return (
                                                <TableRow
                                                    key={entry.id}
                                                    className="bg-destructive/5 hover:bg-destructive/10"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center justify-center">
                                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3 opacity-60">
                                                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                                                <AvatarImage src={entry.profile.avatar_url || ''} />
                                                                <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                                                                    {getInitials(entry.profile.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{entry.profile.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="opacity-60">
                                                            {entry.total_points}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center opacity-60">
                                                        {entry.tasks_completed}
                                                    </TableCell>
                                                    <TableCell className="text-center opacity-60">
                                                        {entry.tasks_not_completed}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="opacity-60">
                                                            {completionRate}%
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center opacity-60">
                                                        -
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
