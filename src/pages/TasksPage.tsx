import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { PageHeader } from '@/components/ui/page-header';
import { useTasks, Task, TaskFormData } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { ListTodo } from 'lucide-react';

export default function TasksPage() {
  const { tasks, users, loading, addTask, updateTask, deleteTask, updateTaskStatus, refetch } = useTasks();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
          subtitle="Crie, edite e gerencie todas as tarefas do sistema"
          icon={ListTodo}
          variant="primary"
        />

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
