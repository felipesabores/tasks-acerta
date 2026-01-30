import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Loader2, Users, Shield, Edit, User, UserPlus, Pencil, Save } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { UserRegistrationForm } from '@/components/users/UserRegistrationForm';


interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  whatsapp?: string;
  cargo?: string;
  role: AppRole;
}

export default function UsersPage() {
  const { isGodMode, canManageUsers, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Edit user dialog state
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editForm, setEditForm] = useState({ name: '', whatsapp: '', cargo: '' });
  const [saving, setSaving] = useState(false);

  // Phone mask function (Brazilian format)
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const fetchUsers = useCallback(async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Fetch roles for each user
    const usersWithRoles: UserWithRole[] = [];
    
    for (const profile of profiles || []) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      usersWithRoles.push({
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        whatsapp: profile.whatsapp || undefined,
        cargo: profile.cargo || undefined,
        role: (roleData?.role as AppRole) || 'user',
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

    // First check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    let error;

    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', authUserId);
      error = updateError;
    } else {
      // Insert new role
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
    setEditingUser(user);
    setEditForm({
      name: user.name,
      whatsapp: user.whatsapp || '',
      cargo: user.cargo || '',
    });
  };

  const handleSaveProfile = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name: editForm.name,
        whatsapp: editForm.whatsapp || null,
        cargo: editForm.cargo || null,
      })
      .eq('id', editingUser.id);

    if (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Perfil atualizado',
        description: 'Os dados do usuário foram atualizados com sucesso.',
      });
      setEditingUser(null);
      fetchUsers();
    }
    
    setSaving(false);
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary">Administrador</Badge>;
      case 'task_editor':
        return <Badge variant="secondary">Editor de Tarefas</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'task_editor':
        return <Edit className="h-4 w-4" />;
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
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
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead>Usuário</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>WhatsApp</TableHead>
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
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">
                                  {user.cargo || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground">
                                  {user.whatsapp || '-'}
                                </span>
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
                                    <SelectItem value="task_editor">Editor de Tarefas</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
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
                  Preencha os dados do novo responsável. Nome, WhatsApp e cargo são obrigatórios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserRegistrationForm onSuccess={fetchUsers} />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription>
                Atualize os dados do usuário. O email não pode ser alterado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={editForm.cargo}
                  onChange={(e) => setEditForm({ ...editForm, cargo: e.target.value })}
                  placeholder="Ex: Analista, Gerente..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={16}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving || !editForm.name.trim()}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
