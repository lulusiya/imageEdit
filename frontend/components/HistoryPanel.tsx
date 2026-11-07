'use client';

import { useLanguage } from '../lib/language';
import Link from 'next/link';
import { isTaskActive } from '../lib/taskFeed';
import { useTaskHistory } from '../lib/taskHistory';
import { TaskCard } from './TaskCard';

export function HistoryPanel() {
  const { t } = useLanguage();
  const { tasks, loading, listError, refresh, retry } = useTaskHistory();
  const activeCount = tasks.filter((entry) => isTaskActive(entry.task)).length;

  return (
    <section id="history" className="history-section" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <h1 id="history-title">{t("我的作品")}</h1>
        </div>
        <div className="history-actions">
          {activeCount > 0 && (
            <span className="active-indicator">
              <span className="pulse-dot" aria-hidden="true" />
              {activeCount} {t("进行中")}
            </span>
          )}
          <button
            type="button"
            className="icon-button history-refresh"
            onClick={refresh}
            disabled={loading}
            aria-label={t('刷新')}
            title={t('刷新')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {listError && (
        <div className="banner banner-error" role="alert">
          <span>{t(listError)}</span>
          <button type="button" className="button ghost small" onClick={refresh}>{t("重试")}</button>
        </div>
      )}

      {loading && tasks.length === 0 && (
        <div className="task-skeletons" aria-label={t("正在加载创作记录")}>
          <div className="skeleton task-skeleton" />
          <div className="skeleton task-skeleton" />
        </div>
      )}

      {!loading && !listError && tasks.length === 0 && (
        <div className="empty-state">
          <p>{t("还没有创作记录。")}</p>
          <Link href="/templates" className="button primary">{t("选一个模板开始")}</Link>
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
              showTitle
            />
          ))}
        </div>
      )}
    </section>
  );
}
