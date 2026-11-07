import { useLanguage } from '../lib/language';
import type { TaskItem, TaskStage } from '../lib/types';

const failureLabels: Record<TaskStage, string> = {
  CHECK: '素材检查失败',
  GENERATE: '生成失败',
  FINALIZE: '整理失败'
};

interface TaskCardProps {
  task: TaskItem;
  queryError: string | null;
  onRetry?: (taskId: number) => void;
  showTitle?: boolean;
}

export function TaskCard({ task, queryError, onRetry, showTitle = false }: TaskCardProps) {
  const { t } = useLanguage();
  const resultUrl = task.status === 'SUCCEEDED' ? task.resultUrl : null;
  const label =
    task.status === 'QUEUED'
      ? '排队中'
      : task.status === 'RUNNING'
        ? '处理中'
        : task.status === 'FAILED' && task.stage
          ? failureLabels[task.stage]
          : task.status === 'FAILED'
            ? '制作失败'
            : '已完成';

  return (
    <article className="work-card">
      <div className="work-art">
        {resultUrl ? (
          <a href={resultUrl} target="_blank" rel="noreferrer" aria-label={t(task.templateTitle)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt={t(task.templateTitle)} loading="lazy" />
          </a>
        ) : (
          <div
            className="work-state"
            title={task.failureReason ? t(task.failureReason) : undefined}
          >
            {task.status === 'RUNNING' && <span className="spinner" aria-hidden="true" />}
            <span>{t(label)}</span>
          </div>
        )}
        {resultUrl && (
          <a
            className="work-action"
            href={resultUrl}
            download={`result-${task.id}.png`}
            aria-label={t('下载结果')}
            title={t('下载结果')}
          >
            ↓
          </a>
        )}
        {queryError && (
          <button
            type="button"
            className="work-query"
            title={t(queryError)}
            onClick={() => onRetry?.(task.id)}
          >
            {t('查询暂时中断')}
            {onRetry ? ` · ${t('重试')}` : ''}
          </button>
        )}
      </div>
      {showTitle && (
        <footer className="work-caption">
          <span>{t(task.templateTitle)}</span>
        </footer>
      )}
    </article>
  );
}
