import { useEffect, useState, useCallback } from "react";
import {
  getAllTasks,
  getUserTasks,
  updateTaskStatus,
} from "../services/taskService";
import { Task } from "../types";

interface UseTasksOptions {
  userId?: string;
  isAdmin?: boolean;
}

export function useTasks({ userId, isAdmin }: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Task[] = [];

      if (isAdmin) {
        data = await getAllTasks();
      } else if (userId) {
        data = await getUserTasks(userId);
      }

      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  const changeStatus = async (id: string, status: string) => {
    try {
      await updateTaskStatus(id, status);
      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusCounts = tasks.reduce<Record<string, number>>(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {}
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    changeStatus,
    statusCounts,
  };
}
