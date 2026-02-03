import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, X, ShieldAlert } from 'lucide-react';

export function PermissionsTable() {
    const permissions = [
        {
            name: 'Criar Tarefas',
            god: true,
            admin: true,
            gestorGeral: false,
            gestorSetor: 'setor', // Special case
            taskEditor: true,
            user: false,
        },
        {
            name: 'Editar Tarefas',
            god: true,
            admin: true,
            gestorGeral: false,
            gestorSetor: false,
            taskEditor: true,
            user: false,
        },
        {
            name: 'Excluir Tarefas',
            god: true,
            admin: true,
            gestorGeral: false,
            gestorSetor: false,
            taskEditor: false,
            user: false,
        },
        {
            name: 'Ver Todas as Tarefas',
            god: true,
            admin: true,
            gestorGeral: true,
            gestorSetor: 'setor',
            taskEditor: false,
            user: false,
        },
        {
            name: 'Gerenciar Usuários',
            god: true,
            admin: true,
            gestorGeral: false,
            gestorSetor: false,
            taskEditor: false,
            user: false,
        },
        {
            name: 'Gerenciar Setores',
            god: true,
            admin: true,
            gestorGeral: false,
            gestorSetor: false,
            taskEditor: false,
            user: false,
        },
        {
            name: 'Check Próprias Tarefas',
            god: true,
            admin: true,
            gestorGeral: true,
            gestorSetor: true,
            taskEditor: true,
            user: true,
        },
    ];

    const renderCheck = (value: boolean | string) => {
        if (value === true) {
            return <Check className="h-4 w-4 text-green-600 mx-auto" />;
        }
        if (value === false) {
            return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
        }
        if (value === 'setor') {
            return <span className="text-xs font-medium text-amber-600">Setor</span>;
        }
        return null;
    };

    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-600/10 flex items-center justify-center">
                        <ShieldAlert className="h-4 w-4 text-purple-600" />
                    </div>
                    Matriz de Permissões
                </CardTitle>
                <CardDescription>
                    Visão geral das permissões de cada papel no sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[200px]">Permissão</TableHead>
                                <TableHead className="text-center bg-purple-50/50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 font-bold">God Mode</TableHead>
                                <TableHead className="text-center font-semibold text-primary">Admin</TableHead>
                                <TableHead className="text-center">Gestor Geral</TableHead>
                                <TableHead className="text-center">Gestor Setor</TableHead>
                                <TableHead className="text-center">Task Editor</TableHead>
                                <TableHead className="text-center">User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {permissions.map((perm) => (
                                <TableRow key={perm.name} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">{perm.name}</TableCell>
                                    <TableCell className="text-center bg-purple-50/30 dark:bg-purple-900/5 border-x border-purple-100 dark:border-purple-900/20">
                                        {renderCheck(perm.god)}
                                    </TableCell>
                                    <TableCell className="text-center border-r border-border/50">
                                        {renderCheck(perm.admin)}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {renderCheck(perm.gestorGeral)}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {renderCheck(perm.gestorSetor)}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {renderCheck(perm.taskEditor)}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {renderCheck(perm.user)}
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
