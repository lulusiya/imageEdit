import type { TaskItem } from './types';

export interface TrackedTask {
  task: TaskItem;
  queryError: string | null;
}

export interface TaskFeedApi {
  list(signal?: AbortSignal): Promise<TaskItem[]>;
  get(id: number, signal?: AbortSignal): Promise<TaskItem>;
}

export interface FeedScheduler {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface TaskFeedOptions {
  api: TaskFeedApi;
  intervalMs?: number;
  scheduler?: FeedScheduler;
  onChange?: (tasks: TrackedTask[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onListErrorChange?: (error: string | null) => void;
}

const ACTIVE_STATUSES = new Set(['QUEUED', 'RUNNING']);

const defaultScheduler: FeedScheduler = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>)
};

export function isTaskActive(task: TaskItem): boolean {
  return ACTIVE_STATUSES.has(task.status);
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.name !== 'AbortError' && error.message) {
    return error.message;
  }
  return fallback;
}

/**
 * Framework-agnostic polling engine.
 *
 * - Only active tasks are polled; terminal tasks stop immediately.
 * - At most one in-flight query per task.
 * - A query failure keeps the last known task data and exposes queryError only;
 *   it never marks the backend task as failed. The caller decides when to retry.
 * - stop()/refresh() bump the epoch and abort in-flight requests, so responses
 *   from a previous user or page cannot write into the current state.
 */
export class TaskFeed {
  private readonly api: TaskFeedApi;
  private readonly intervalMs: number;
  private readonly scheduler: FeedScheduler;
  private readonly onChange?: (tasks: TrackedTask[]) => void;
  private readonly onLoadingChange?: (loading: boolean) => void;
  private readonly onListErrorChange?: (error: string | null) => void;

  private tasks: TrackedTask[] = [];
  private epoch = 0;
  private disposed = false;
  private loading = false;
  private listError: string | null = null;
  private readonly timers = new Map<number, unknown>();
  private readonly controllers = new Map<number, AbortController>();
  private listController: AbortController | null = null;

  constructor(options: TaskFeedOptions) {
    this.api = options.api;
    this.intervalMs = Math.max(100, options.intervalMs ?? 1500);
    this.scheduler = options.scheduler ?? defaultScheduler;
    this.onChange = options.onChange;
    this.onLoadingChange = options.onLoadingChange;
    this.onListErrorChange = options.onListErrorChange;
  }

  start(): void {
    void this.load(true);
  }

  stop(): void {
    this.disposed = true;
    this.epoch += 1;
    this.clearPolling();
  }

  refresh(): void {
    if (this.disposed) {
      return;
    }
    void this.load(false);
  }

  getSnapshot(): TrackedTask[] {
    return this.tasks;
  }

  addTask(task: TaskItem): void {
    if (this.disposed) {
      return;
    }
    if (this.tasks.some((entry) => entry.task.id === task.id)) {
      this.tasks = this.tasks.map((entry) =>
        entry.task.id === task.id ? { task, queryError: null } : entry
      );
    } else {
      this.tasks = [{ task, queryError: null }, ...this.tasks];
    }
    this.emit();
    if (isTaskActive(task)) {
      this.schedule(task.id, 0);
    }
  }

  retry(taskId: number): void {
    if (this.disposed || this.timers.has(taskId) || this.controllers.has(taskId)) {
      return;
    }
    if (!this.tasks.some((entry) => entry.task.id === taskId)) {
      return;
    }
    this.tasks = this.tasks.map((entry) =>
      entry.task.id === taskId ? { ...entry, queryError: null } : entry
    );
    this.emit();
    void this.poll(taskId);
  }

  private async load(initial: boolean): Promise<void> {
    const epoch = ++this.epoch;
    this.clearPolling();

    if (initial) {
      this.tasks = [];
      this.emit();
    }
    this.setLoading(true);
    this.setListError(null);

    const controller = new AbortController();
    this.listController = controller;
    try {
      const list = await this.api.list(controller.signal);
      if (epoch !== this.epoch) {
        return;
      }
      const seen = new Set<number>();
      const next: TrackedTask[] = [];
      for (const task of list) {
        if (!seen.has(task.id)) {
          seen.add(task.id);
          next.push({ task, queryError: null });
        }
      }
      this.tasks = next;
      this.emit();
      for (const entry of next) {
        if (isTaskActive(entry.task)) {
          this.schedule(entry.task.id);
        }
      }
    } catch (error) {
      if (epoch !== this.epoch || isAbortError(error)) {
        return;
      }
      this.setListError(describeError(error, '加载历史任务失败'));
    } finally {
      if (epoch === this.epoch) {
        this.setLoading(false);
        if (this.listController === controller) {
          this.listController = null;
        }
      }
    }
  }

  private schedule(taskId: number, delayMs = this.intervalMs): void {
    if (this.disposed || this.timers.has(taskId)) {
      return;
    }
    const handle = this.scheduler.setTimeout(() => {
      this.timers.delete(taskId);
      void this.poll(taskId);
    }, delayMs);
    this.timers.set(taskId, handle);
  }

  private async poll(taskId: number): Promise<void> {
    if (this.disposed) {
      return;
    }
    const epoch = this.epoch;
    const controller = new AbortController();
    this.controllers.set(taskId, controller);
    try {
      const task = await this.api.get(taskId, controller.signal);
      if (epoch !== this.epoch || this.disposed) {
        return;
      }
      if (!this.tasks.some((entry) => entry.task.id === taskId)) {
        return;
      }
      this.tasks = this.tasks.map((entry) =>
        entry.task.id === taskId ? { task, queryError: null } : entry
      );
      this.emit();
      if (isTaskActive(task)) {
        this.schedule(taskId);
      }
    } catch (error) {
      if (epoch !== this.epoch || this.disposed || isAbortError(error)) {
        return;
      }
      this.tasks = this.tasks.map((entry) =>
        entry.task.id === taskId
          ? { ...entry, queryError: describeError(error, '任务查询失败，请稍后重试') }
          : entry
      );
      this.emit();
    } finally {
      if (this.controllers.get(taskId) === controller) {
        this.controllers.delete(taskId);
      }
    }
  }

  private clearPolling(): void {
    for (const handle of this.timers.values()) {
      this.scheduler.clearTimeout(handle);
    }
    this.timers.clear();
    for (const controller of this.controllers.values()) {
      controller.abort();
    }
    this.controllers.clear();
    this.listController?.abort();
    this.listController = null;
  }

  private setLoading(loading: boolean): void {
    if (this.loading === loading) {
      return;
    }
    this.loading = loading;
    this.onLoadingChange?.(loading);
  }

  private setListError(error: string | null): void {
    if (this.listError === error) {
      return;
    }
    this.listError = error;
    this.onListErrorChange?.(error);
  }

  private emit(): void {
    this.onChange?.(this.tasks);
  }
}
