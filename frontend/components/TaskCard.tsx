import { formatDateTime } from '../lib/format';
import type { TaskItem, TaskStage, TaskStatus } from '../lib/types';

const STAGE_ORDER: TaskStage[] = ['CHECK', 'GENERATE', 'FINALIZE'];

const STAGE_LABELS: Record<TaskStage, string> = {
  CHECK: '素材检查',
  GENERATE: '模拟生成',
  FINALIZE: '结果整理'
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  QUEUED: '排队中',
  RUNNING: '处理中',
  SUCCEEDED: '已完成',
  FAILED: '失败'
};

type StepState = 'done' | 'active' | 'failed' | 'pending';

function stepState(task: TaskItem, index: number): StepState {
  if (task.status === 'SUCCEEDED') {
    return 'done';
  }
  if (task.status === 'QUEUED') {
    return 'pending';
  }
  const currentIndex = task.stage ? STAGE_ORDER.indexOf(task.stage) : -1;
  if (task.status === 'FAILED') {
    if (index < currentIndex) {
      return 'done';
    }
    return index === currentIndex ? 'failed' : 'pending';
  }
  if (index < currentIndex) {
    return 'done';
  }
  return index === currentIndex ? 'active' : 'pending';
}

interface TaskCardProps {
  task: TaskItem;
  queryError: string | null;
  onRetry?: (taskId: number) => void;
}

export function TaskCard({ task, queryError, onRetry }: TaskCardProps) {
  const failureStage = task.status === 'FAILED' && task.stage ? STAGE_LABELS[task.stage] : null;

  return (
    <article className="task-card">
      <header className="task-card-header">
        <div>
          <h3>{task.templateTitle}</h3>
          <p className="task-meta">
            任务 #{task.id} · 提交于 {formatDateTime(task.createdAt)}
          </p>
        </div>
        <span className={`status-pill status-${task.status.toLowerCase()}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </header>

      <ol className="stage-tracker" aria-label="任务处理阶段">
        {STAGE_ORDER.map((stage, index) => {
          const state = stepState(task, index);
          return (
            <li key={stage} className={`stage-step stage-${state}`}>
              <span className="stage-dot" aria-hidden="true" />
              <span className="stage-label">{STAGE_LABELS[stage]}</span>
            </li>
          );
        })}
      </ol>

      {task.status === 'FAILED' && task.failureReason && (
        <div className="task-failure" role="alert">
          <strong>任务失败{failureStage ? ` · ${failureStage}` : ''}</strong>
          <span>{task.failureReason}</span>
        </div>
      )}

      {queryError && (
        <div className="task-query-error">
          <span>状态查询失败：{queryError}。已暂停自动刷新，任务本身可能仍在处理。</span>
          {onRetry && (
            <button
              type="button"
              className="button ghost small"
              onClick={() => onRetry(task.id)}
            >
              重试查询
            </button>
          )}
        </div>
      )}

      {task.resultUrl && (
        <a
          className="task-result-preview"
          href={task.resultUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`查看 ${task.templateTitle} 的生成结果`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={task.resultUrl} alt={`${task.templateTitle} 生成结果`} loading="lazy" />
        </a>
      )}

      <footer className="task-card-footer">
        <span>更新于 {formatDateTime(task.updatedAt)}</span>
        {task.resultUrl && (
          <div className="task-result-actions">
            <a href={task.resultUrl} target="_blank" rel="noreferrer">
              查看结果
            </a>
            <a href={task.resultUrl} download={`result-${task.id}.png`}>
              下载
            </a>
          </div>
        )}
      </footer>
    </article>
  );
}
