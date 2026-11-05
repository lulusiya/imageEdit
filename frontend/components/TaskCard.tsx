import { formatDateTime } from '../lib/format';
import type { TaskItem, TaskStage } from '../lib/types';

const stageLabels: Record<TaskStage, string> = {
  CHECK: '检查素材',
  GENERATE: '生成中',
  FINALIZE: '整理结果'
};

interface TaskCardProps {
  task: TaskItem;
  queryError: string | null;
  onRetry?: (taskId: number) => void;
}

export function TaskCard({ task, queryError, onRetry }: TaskCardProps) {
  const stage = task.stage && stageLabels[task.stage];
  const labels = {
    QUEUED: '排队中',
    RUNNING: stage || '处理中',
    FAILED: '制作失败',
    SUCCEEDED: '已完成'
  };

  return (
    <article className="work-card">
      {task.status === 'SUCCEEDED' && task.resultUrl ? (
        <a className="work-art" href={task.resultUrl} target="_blank" rel="noreferrer"
          aria-label={`预览已完成的${task.templateTitle}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={task.resultUrl} alt={task.templateTitle} loading="lazy" />
        </a>
      ) : (
        <div className="work-art work-state">
          {task.status === 'RUNNING' && <span className="spinner" aria-hidden="true" />}
          <span>{labels[task.status]}</span>
          {task.status === 'FAILED' && (
            <small>{[stage, task.failureReason].filter(Boolean).join(' · ')}</small>
          )}
        </div>
      )}
      <div className="work-caption">
        <div><h3>{task.templateTitle}</h3><time dateTime={task.createdAt}>{formatDateTime(task.createdAt)}</time></div>
        {task.resultUrl && <a className="work-download" href={task.resultUrl} download={`result-${task.id}.png`} aria-label={`下载${task.templateTitle}`} title="下载结果">↓</a>}
      </div>
      {queryError && (
        <div className="work-query" title={queryError}>
          查询暂时中断
          {onRetry && <button type="button" onClick={() => onRetry(task.id)}>重试</button>}
        </div>
      )}
    </article>
  );
}
