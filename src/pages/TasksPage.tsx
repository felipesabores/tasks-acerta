import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { useTasks, Task, TaskFormData } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

export default function TasksPage() {
  const { tasks, users, loading, addTask, updateTask, deleteTask, updateTaskStatus } = useTasks();
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
      <TaskList
        tasks={tasks}
        users={users}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={updateTaskStatus}
        onNewTask={handleNewTask}
      />
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
