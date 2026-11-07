'use client';

import { useLanguage } from '../lib/language';
import { useEffect, useState } from 'react';
import { useTaskHistory } from '../lib/taskHistory';
import { TaskCard } from './TaskCard';

type HistoryView = 'row' | 'grid';
const VIEW_STORAGE_KEY = 'studio-history-view';

export function TemplateTasks({ templateId }: { templateId: string }) {
  const { t } = useLanguage();
  const { tasks, loading, listError, refresh, retry } = useTaskHistory();
  const [view, setView] = useState<HistoryView>('row');
  const related = tasks.filter((entry) => entry.task.templateId === templateId).slice(0, 8);

  useEffect(() => {
    if (localStorage.getItem(VIEW_STORAGE_KEY) === 'grid') {
      setView('grid');
    }
  }, []);

  const changeView = (next: HistoryView) => {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  return (
    <section className="template-tasks" aria-labelledby="template-tasks-title">
      <div className="section-heading compact">
        <h2 id="template-tasks-title">{t('历史')}</h2>
        <div className="history-tools">
          <button
            className={`icon-button view-toggle ${view === 'row' ? 'active' : ''}`}
            type="button"
            onClick={() => changeView('row')}
            aria-pressed={view === 'row'}
            aria-label={t('横向排列')}
            title={t('横向排列')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="7" height="14" rx="1.6" />
              <rect x="14" y="5" width="7" height="14" rx="1.6" />
            </svg>
          </button>
          <button
            className={`icon-button view-toggle ${view === 'grid' ? 'active' : ''}`}
            type="button"
            onClick={() => changeView('grid')}
            aria-pressed={view === 'grid'}
            aria-label={t('网格排列')}
            title={t('网格排列')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="1.4" />
              <rect x="13" y="3" width="8" height="8" rx="1.4" />
              <rect x="3" y="13" width="8" height="8" rx="1.4" />
              <rect x="13" y="13" width="8" height="8" rx="1.4" />
            </svg>
          </button>
          <button
            className="icon-button history-refresh"
            type="button"
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
      {listError && <p className="banner banner-error" role="alert">{t(listError)}</p>}
      {!listError && related.length === 0 && (
        <p className="history-placeholder">{t(loading ? '正在读取记录…' : '暂无作品')}</p>
      )}
      <div className={`task-list ${view === 'grid' ? 'grid-view' : 'row-view'}`}>
        {related.map((entry) => (
          <TaskCard
            key={entry.task.id}
            task={entry.task}
            queryError={entry.queryError}
            onRetry={retry}
          />
        ))}
      </div>
    </section>
  );
}
