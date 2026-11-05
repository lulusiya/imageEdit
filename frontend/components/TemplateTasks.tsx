'use client';

import { useTaskHistory } from '../lib/taskHistory';
import { TaskCard } from './TaskCard';

export function TemplateTasks({ templateId }: { templateId: string }) {
  const { tasks, loading, retry } = useTaskHistory();
  const related = tasks.filter((entry) => entry.task.templateId === templateId).slice(0, 3);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="template-tasks" aria-labelledby="template-tasks-title">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">RECENT JOBS</p>
          <h2 id="template-tasks-title">本模板的最近任务</h2>
          <p className="section-note">
            同一页面内多个任务独立轮询，互不覆盖{loading ? '，正在同步最新状态…' : '。'}
          </p>
        </div>
      </div>
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
