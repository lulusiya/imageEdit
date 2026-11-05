'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { taskFeedApi } from './api';
import { TaskFeed, type TrackedTask } from './taskFeed';
import type { TaskItem } from './types';

export interface TaskFeedState {
  tasks: TrackedTask[];
  loading: boolean;
  listError: string | null;
  refresh: () => void;
  addTask: (task: TaskItem) => void;
  retry: (taskId: number) => void;
}

export function useTaskFeed(userId: string | null, intervalMs = 1500): TaskFeedState {
  const [tasks, setTasks] = useState<TrackedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const feedRef = useRef<TaskFeed | null>(null);

  useEffect(() => {
    setTasks([]);
    setListError(null);

    if (!userId) {
      setLoading(false);
      feedRef.current = null;
      return;
    }

    setLoading(true);

    const feed = new TaskFeed({
      api: taskFeedApi,
      intervalMs,
      onChange: setTasks,
      onLoadingChange: setLoading,
      onListErrorChange: setListError
    });
    feedRef.current = feed;
    feed.start();

    return () => {
      feed.stop();
      feedRef.current = null;
    };
  }, [userId, intervalMs]);

  const refresh = useCallback(() => {
    feedRef.current?.refresh();
  }, []);

  const addTask = useCallback((task: TaskItem) => {
    feedRef.current?.addTask(task);
  }, []);

  const retry = useCallback((taskId: number) => {
    feedRef.current?.retry(taskId);
  }, []);

  return { tasks, loading, listError, refresh, addTask, retry };
}
