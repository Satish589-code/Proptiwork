import { supabase } from "@/integrations/supabase/client";
import { Task, TaskStatus } from "../types";

export const getAllTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*,task_attachments(*)")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Task[];
};

export const getUserTasks = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*,task_attachments(*)")
    .eq("assigned_to", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Task[];
};

export const createTask = async (task: any) => {
  const { data, error } = await supabase
    .from("tasks")
    .insert(task)
    .select();

  if (error) throw error;
  return data;
};

export const updateTaskStatus = async (
  id: string,
  status: TaskStatus
) => {
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
};

export const updateTasksStatusBulk = async (
  ids: string[],
  status: TaskStatus
) => {
  if (!ids.length) return;
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .in("id", ids);

  if (error) throw error;
};

export const softDeleteTask = async (id: string) => {
  const { error } = await supabase
    .from("tasks")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) throw error;
};

export const softDeleteTasksBulk = async (ids: string[]) => {
  if (!ids.length) return;
  const { error } = await supabase
    .from("tasks")
    .update({ is_deleted: true })
    .in("id", ids);

  if (error) throw error;
};
