export type TaskStatus =
  | "todo"
  | "in_progress"
  | "completed"
  | "approved"
  | "rejected";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_hours?: number;
  due_date?: string;
  attachment_url?: string;
  task_attachments?: {
    id?: string;
    task_id: string;
    file_name: string;
    file_url: string;
    created_at?: string;
  }[];
  assigned_to: string;
  created_by: string;
  created_at: string;
}
