'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, type ReactNode } from 'react';
import { useIdentity } from './identity';
import { useTaskFeed, type TaskFeedState } from './useTaskFeed';

const TaskHistoryContext = createContext<TaskFeedState | null>(null);

export function TaskHistoryProvider({ children }: { children: ReactNode }) {
  const { user, status } = useIdentity();
  const pathname = usePathname();
  const showsHistory = pathname === '/history' || pathname.startsWith('/templates/');
  const feed = useTaskFeed(showsHistory && status === 'ready' && user ? user.id : null);

  return <TaskHistoryContext.Provider value={feed}>{children}</TaskHistoryContext.Provider>;
}

export function useTaskHistory(): TaskFeedState {
  const context = useContext(TaskHistoryContext);
  if (!context) {
    throw new Error('useTaskHistory must be used inside TaskHistoryProvider');
  }
  return context;
}
