import { useState, useCallback } from 'react';
import { Task, TaskFormData, TaskStatus } from '@/types/task';
import { mockTasks, mockUsers } from '@/data/mockData';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const addTask = useCallback((data: TaskFormData) => {
    const assignedUser = mockUsers.find(u => u.id === data.assignedToId);
    if (!assignedUser) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      status: data.status,
      assignedTo: assignedUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: data.dueDate,
    };

    setTasks(prev => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, data: Partial<TaskFormData>) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== id) return task;

        const assignedUser = data.assignedToId
          ? mockUsers.find(u => u.id === data.assignedToId) || task.assignedTo
          : task.assignedTo;

        return {
          ...task,
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.status && { status: data.status }),
          ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
          assignedTo: assignedUser,
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    updateTask(id, { status });
  }, [updateTask]);

  const getTasksByUser = useCallback((userId: string) => {
    return tasks.filter(task => task.assignedTo.id === userId);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getStats = useCallback(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, pending, inProgress, done, completionRate };
  }, [tasks]);

  const getStatsByUser = useCallback(() => {
    return mockUsers.map(user => {
      const userTasks = tasks.filter(t => t.assignedTo.id === user.id);
      const done = userTasks.filter(t => t.status === 'done').length;
      const total = userTasks.length;
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        user,
        total,
        done,
        pending: userTasks.filter(t => t.status === 'pending').length,
        inProgress: userTasks.filter(t => t.status === 'in_progress').length,
        completionRate,
      };
    });
  }, [tasks]);

  return {
    tasks,
    users: mockUsers,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getTasksByUser,
    getTasksByStatus,
    getStats,
    getStatsByUser,
  };
}
