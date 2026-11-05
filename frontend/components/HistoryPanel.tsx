'use client';

import Link from 'next/link';
import { isTaskActive } from '../lib/taskFeed';
import { useTaskHistory } from '../lib/taskHistory';
import { TaskCard } from './TaskCard';

export function HistoryPanel() {
  const { tasks, loading, listError, refresh, retry } = useTaskHistory();
  const activeCount = tasks.filter((entry) => isTaskActive(entry.task)).length;

  return (
    <section id="history" className="history-section" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MY CREATIONS</p>
          <h2 id="history-title">我的创作</h2>
          <p className="section-note">
            进行中的任务会自动轮询；到达终态后立即停止刷新，网络异常不会篡改后端任务状态。
          </p>
        </div>
        <div className="history-actions">
          {activeCount > 0 && (
            <span className="active-indicator">
              <span className="pulse-dot" aria-hidden="true" />
              {activeCount} 个进行中
            </span>
          )}
          <button
            type="button"
            className="button ghost"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? '刷新中…' : '刷新记录'}
          </button>
        </div>
      </div>

      {listError && (
        <div className="banner banner-error" role="alert">
          <span>{listError}</span>
          <button type="button" className="button ghost small" onClick={refresh}>
            重试
          </button>
        </div>
      )}

      {loading && tasks.length === 0 && (
        <div className="task-skeletons" aria-label="正在加载创作记录">
          <div className="skeleton task-skeleton" />
          <div className="skeleton task-skeleton" />
        </div>
      )}

      {!loading && !listError && tasks.length === 0 && (
        <div className="empty-state">
          <p>还没有创作记录。</p>
          <Link href="/#templates" className="button primary">
            选一个模板开始
          </Link>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="task-list">
          {tasks.map((entry) => (
            <TaskCard
              key={entry.task.id}
              task={entry.task}
              queryError={entry.queryError}
              onRetry={retry}
            />
          ))}
        </div>
      )}
    </section>
  );
}
