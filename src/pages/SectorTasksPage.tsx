import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Building2, Edit, Trash2, ListTodo } from 'lucide-react';
import { useSectors } from '@/hooks/useSectors';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task, TaskFormData } from '@/hooks/useTasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Criticality = 'low' | 'medium' | 'high' | 'critical';

interface SectorTask {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done';
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  criticality: Criticality;
  is_mandatory: boolean;
  points: number;
  sector_id: string | null;
  profiles?: { id: string; name: string } | null;
  sectors?: { id: string; name: string } | null;
}

interface Profile {
  id: string;
  name: string;
  user_id: string;
}

export default function SectorTasksPage() {
  const { sectors, userSectorIds, loading: sectorsLoading } = useSectors();
  const { isGestorSetor } = useUserRole();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<SectorTask[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SectorTask | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Get user's sectors
  const userSectors = useMemo(() => {
    return sectors.filter(s => userSectorIds.includes(s.id));
  }, [sectors, userSectorIds]);

  // Set default selected sector
  useEffect(() => {
    if (userSectors.length > 0 && !selectedSectorId) {
      setSelectedSectorId(userSectors[0].id);
    }
  }, [userSectors, selectedSectorId]);

  // Fetch tasks for selected sector
  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedSectorId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:assigned_to(id, name),
          sectors:sector_id(id, name)
        `)
        .eq('sector_id', selectedSectorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sector tasks:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as tarefas do setor.',
          variant: 'destructive',
        });
      } else {
        const typedData = (data || []).map(task => ({
          ...task,
          criticality: (task.criticality || 'medium') as Criticality,
        }));
        setTasks(typedData);
      }
      setLoading(false);
    };

    fetchTasks();
  }, [selectedSectorId, toast]);

  // Fetch users in sector
  useEffect(() => {
    const fetchSectorUsers = async () => {
      if (!selectedSectorId) return;

      const { data, error } = await supabase
        .from('profile_sectors')
        .select(`
          profiles:profile_id(id, name, user_id)
        `)
        .eq('sector_id', selectedSectorId);

      if (error) {
        console.error('Error fetching sector users:', error);
      } else {
        const profiles = data?.map(d => d.profiles).filter(Boolean) as Profile[];
        setUsers(profiles || []);
      }
    };

    fetchSectorUsers();
  }, [selectedSectorId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  const handleNewTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEdit = (task: SectorTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update({
            ...data,
            sector_id: selectedSectorId,
          })
          .eq('id', editingTask.id);

        if (error) throw error;
        
        toast({
          title: 'Tarefa atualizada',
          description: 'A tarefa foi atualizada com sucesso.',
        });
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        const { error } = await supabase
          .from('tasks')
          .insert({
            ...data,
            sector_id: selectedSectorId,
            created_by: profile?.id,
          });

        if (error) throw error;
        
        toast({
          title: 'Tarefa criada',
          description: 'A nova tarefa foi criada com sucesso.',
        });
      }

      // Refresh tasks
      const { data: newTasks } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:assigned_to(id, name),
          sectors:sector_id(id, name)
        `)
        .eq('sector_id', selectedSectorId)
        .order('created_at', { ascending: false });
      
      const typedNewTasks = (newTasks || []).map(task => ({
        ...task,
        criticality: (task.criticality || 'medium') as Criticality,
      }));
      setTasks(typedNewTasks);
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a tarefa.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTaskId) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', deleteTaskId);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== deleteTaskId));
      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tarefa.',
        variant: 'destructive',
      });
    } finally {
      setDeleteTaskId(null);
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'in_progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da tarefa.',
        variant: 'destructive',
      });
    }
  };

  if (sectorsLoading) {
    return (
      <AppLayout title="Tarefas do Setor">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (userSectors.length === 0) {
    return (
      <AppLayout title="Tarefas do Setor">
        <div className="space-y-6">
          <PageHeader
            title="Tarefas do Setor"
            subtitle="Gerencie as tarefas do seu setor"
            icon={Building2}
            variant="primary"
          />
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você não está vinculado a nenhum setor.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Entre em contato com o administrador para ser adicionado a um setor.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Tarefas do Setor">
      <div className="space-y-6">
        <PageHeader
          title="Tarefas do Setor"
          subtitle="Crie e gerencie tarefas para os membros do seu setor"
          icon={Building2}
          variant="primary"
        />

        {/* Sector selector and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4 items-center">
            {userSectors.length > 1 && (
              <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {userSectors.map(sector => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {userSectors.length === 1 && (
              <Badge variant="secondary" className="text-sm">
                <Building2 className="h-3 w-3 mr-1" />
                {userSectors[0].name}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Tasks grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {tasks.length === 0 ? 'Nenhuma tarefa criada neste setor.' : 'Nenhuma tarefa encontrada.'}
              </p>
              {tasks.length === 0 && (
                <Button variant="link" onClick={handleNewTask} className="mt-2">
                  Criar primeira tarefa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task as Task}
                onEdit={(t) => handleEdit(t as SectorTask)}
                onDelete={(id) => setDeleteTaskId(id)}
                onStatusChange={handleStatusChange}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        task={editingTask as Task | null}
        users={users}
      />

      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
