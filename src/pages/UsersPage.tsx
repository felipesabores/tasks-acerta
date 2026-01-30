import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Loader2, Users, Shield, Edit, User, UserPlus, Pencil, Building2, CheckCircle, XCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { UserRegistrationForm } from '@/components/users/UserRegistrationForm';
import { UserEditDialog, UserToEdit } from '@/components/users/UserEditDialog';
import { CompanyManagement } from '@/components/companies/CompanyManagement';

interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  username?: string;
  whatsapp?: string;
  cargo?: string;
  company_id?: string;
  company_name?: string;
  position_id?: string;
  position_name?: string;
  sector_id?: string;
  sector_name?: string;
  is_active: boolean;
  role: AppRole;
}

export default function UsersPage() {
  const { isGodMode, canManageUsers, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserToEdit | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        companies:company_id(id, name),
        company_positions:position_id(id, name)
      `)
      .order('name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Fetch roles and sectors for each user
    const usersWithRoles: UserWithRole[] = [];
    
    for (const profile of profiles || []) {
      const [roleResult, sectorResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.user_id)
          .maybeSingle(),
        supabase
          .from('profile_sectors')
          .select('sector_id, sectors:sector_id(id, name)')
          .eq('profile_id', profile.id)
          .maybeSingle()
      ]);

      usersWithRoles.push({
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        username: profile.username || undefined,
        whatsapp: profile.whatsapp || undefined,
        cargo: profile.cargo || undefined,
        company_id: profile.company_id || undefined,
        company_name: (profile.companies as any)?.name || undefined,
        position_id: profile.position_id || undefined,
        position_name: (profile.company_positions as any)?.name || undefined,
        sector_id: (sectorResult.data?.sectors as any)?.id || undefined,
        sector_name: (sectorResult.data?.sectors as any)?.name || undefined,
        is_active: profile.is_active,
        role: (roleResult.data?.role as AppRole) || 'user',
      });
    }

    setUsers(usersWithRoles);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers, fetchUsers]);

  const handleRoleChange = async (userId: string, authUserId: string, newRole: AppRole) => {
    setUpdatingUserId(userId);

    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    let error;

    if (existingRole) {
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', authUserId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: authUserId, role: newRole });
      error = insertError;
    }

    if (error) {
      toast({
        title: 'Erro ao atualizar papel',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Papel atualizado',
        description: 'O papel do usuário foi atualizado com sucesso.',
      });
      fetchUsers();
    }

    setUpdatingUserId(null);
  };

  const openEditDialog = (user: UserWithRole) => {
    setEditingUser({
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      username: user.username,
      whatsapp: user.whatsapp,
      company_id: user.company_id,
      position_id: user.position_id,
      sector_id: user.sector_id,
      is_active: user.is_active,
      role: user.role,
    });
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'god_mode':
        return <Badge className="bg-purple-600 text-white">God Mode</Badge>;
      case 'admin':
        return <Badge className="bg-primary">Administrador</Badge>;
      case 'task_editor':
        return <Badge variant="secondary">Editor de Tarefas</Badge>;
      case 'gestor_setor':
        return <Badge className="bg-teal-600 text-white">Gestor de Setor</Badge>;
      case 'gestor_geral':
        return <Badge className="bg-indigo-600 text-white">Gestor Geral</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'god_mode':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'task_editor':
        return <Edit className="h-4 w-4" />;
      case 'gestor_setor':
        return <Users className="h-4 w-4 text-teal-600" />;
      case 'gestor_geral':
        return <Users className="h-4 w-4 text-indigo-600" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (roleLoading) {
    return (
      <AppLayout title="Gerenciar Usuários">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!canManageUsers) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout title="Gerenciar Usuários">
      <div className="space-y-6">
        <PageHeader
          title="Gerenciar Usuários"
          subtitle="Gerencie os usuários do sistema e defina seus papéis"
          icon={Users}
          variant="primary"
        />

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Cadastrar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Usuários do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead>Usuário</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Setor</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Papel</TableHead>
                          <TableHead>Alterar Papel</TableHead>
                          <TableHead className="w-[80px]">Editar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => {
                          const initials = user.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                          return (
                            <TableRow key={user.id} className="transition-colors hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.name}</p>
                                    {user.whatsapp && (
                                      <p className="text-xs text-muted-foreground">{user.whatsapp}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground font-mono text-sm">
                                  {user.username || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {user.company_name ? (
                                  <Badge variant="outline" className="font-normal">
                                    {user.company_name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">
                                  {user.sector_name || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">
                                  {user.position_name || user.cargo || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {user.is_active ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/20">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inativo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(user.role)}
                                  {getRoleBadge(user.role)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.role}
                                  onValueChange={(value: AppRole) => 
                                    handleRoleChange(user.id, user.user_id, value)
                                  }
                                  disabled={updatingUserId === user.id}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    {updatingUserId === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <SelectValue />
                                    )}
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Usuário</SelectItem>
                                    <SelectItem value="gestor_setor">Gestor de Setor</SelectItem>
                                    <SelectItem value="gestor_geral">Gestor Geral</SelectItem>
                                    <SelectItem value="task_editor">Editor de Tarefas</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    {isGodMode && (
                                      <SelectItem value="god_mode">God Mode</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(user)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role descriptions with premium style */}
            <Card className="border-muted/50 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent">
              <CardHeader>
                <CardTitle>Descrição dos Papéis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Administrador</p>
                    <p className="text-sm text-muted-foreground">
                      Controle total sobre o sistema. Pode criar, editar e excluir tarefas, 
                      gerenciar usuários e alterar papéis.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Editor de Tarefas</p>
                    <p className="text-sm text-muted-foreground">
                      Pode criar e editar tarefas, mas não pode excluí-las ou gerenciar usuários.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-muted/50">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Usuário</p>
                    <p className="text-sm text-muted-foreground">
                      Pode visualizar suas tarefas atribuídas e marcar itens do checklist como concluídos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  Cadastrar Novo Usuário
                </CardTitle>
                <CardDescription>
                  Preencha os dados do novo responsável. Nome, Username, Empresa, Setor e Cargo são obrigatórios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserRegistrationForm onSuccess={fetchUsers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <CompanyManagement />
          </TabsContent>

        </Tabs>

        {/* Edit User Dialog */}
        <UserEditDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={fetchUsers}
          isGodMode={isGodMode}
        />
      </div>
    </AppLayout>
  );
}
