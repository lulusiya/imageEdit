'use client';

import { useTaskHistory } from '../lib/taskHistory';
import { TaskCard } from './TaskCard';

export function TemplateTasks({ templateId }: { templateId: string }) {
  const { tasks, loading, listError, refresh, retry } = useTaskHistory();
  const related = tasks.filter((entry) => entry.task.templateId === templateId).slice(0, 3);


  return (
    <section className="template-tasks" aria-labelledby="template-tasks-title">
      <div className="section-heading compact">
        <h2 id="template-tasks-title">制作历史</h2>
        <button className="button ghost small" type="button" onClick={refresh} disabled={loading}>
          {loading ? '刷新中…' : '刷新'}
        </button>
      </div>
      {listError && <p className="banner banner-error" role="alert">{listError}</p>}
      {!listError && related.length === 0 && (
        <p className="history-placeholder">{loading ? '正在读取记录…' : '这个模板还没有制作记录'}</p>
      )}
      <div className="task-list">
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
