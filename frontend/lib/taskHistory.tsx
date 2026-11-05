'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useIdentity } from './identity';
import { useTaskFeed, type TaskFeedState } from './useTaskFeed';

const TaskHistoryContext = createContext<TaskFeedState | null>(null);

/**
 * Owns the single polling feed for the whole app so that navigation between
 * the template library and a template detail page keeps the same history and
 * never starts a second poller for the same identity.
 */
export function TaskHistoryProvider({ children }: { children: ReactNode }) {
  const { user, status } = useIdentity();
  const feed = useTaskFeed(status === 'ready' && user ? user.id : null);

  return <TaskHistoryContext.Provider value={feed}>{children}</TaskHistoryContext.Provider>;
}

export function useTaskHistory(): TaskFeedState {
  const context = useContext(TaskHistoryContext);
  if (!context) {
    throw new Error('useTaskHistory must be used inside TaskHistoryProvider');
  }
  return context;
}
