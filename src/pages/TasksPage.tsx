import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { TaskTemplateManagement } from '@/components/tasks/TaskTemplateManagement';
import { PageHeader } from '@/components/ui/page-header';
import { useTasks, Task, TaskFormData } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListTodo, FileText } from 'lucide-react';

export default function TasksPage() {
  const { tasks, users, loading, addTask, updateTask, deleteTask, updateTaskStatus, refetch } = useTasks();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');

  const handleNewTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
      toast({
        title: 'Tarefa atualizada',
        description: 'A tarefa foi atualizada com sucesso.',
      });
    } else {
      await addTask(data);
      toast({
        title: 'Tarefa criada',
        description: 'A nova tarefa foi criada com sucesso.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    toast({
      title: 'Tarefa excluída',
      description: 'A tarefa foi removida com sucesso.',
      variant: 'destructive',
    });
  };

  return (
    <AppLayout title="Tarefas">
      <div className="space-y-6">
        <PageHeader
          title="Gerenciar Tarefas"
          subtitle="Crie, edite e gerencie todas as tarefas e modelos do sistema"
          icon={ListTodo}
          variant="primary"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Modelos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <TaskList
              tasks={tasks}
              users={users}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={updateTaskStatus}
              onNewTask={handleNewTask}
              onTaskUpdated={refetch}
            />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TaskTemplateManagement />
          </TabsContent>
        </Tabs>
      </div>
      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        task={editingTask}
        users={users}
      />
    </AppLayout>
  );
}