export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedTo: User;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  assignedToId: string;
  dueDate?: Date;
}
