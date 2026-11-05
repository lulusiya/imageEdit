import { describe, expect, it } from 'vitest';
import { TaskFeed, type FeedScheduler, type TaskFeedApi, type TrackedTask } from './taskFeed';
import type { TaskItem, TaskStage, TaskStatus } from './types';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

class ManualScheduler implements FeedScheduler {
  private now = 0;
  private nextId = 1;
  private readonly items = new Map<number, { due: number; callback: () => void }>();

  setTimeout(callback: () => void, ms: number): unknown {
    const id = this.nextId++;
    this.items.set(id, { due: this.now + ms, callback });
    return id;
  }

  clearTimeout(handle: unknown): void {
    if (typeof handle === 'number') {
      this.items.delete(handle);
    }
  }

  get size(): number {
    return this.items.size;
  }

  advance(ms: number): void {
    this.now += ms;
    for (;;) {
      const due = [...this.items.entries()]
        .filter(([, value]) => value.due <= this.now)
        .sort((a, b) => a[1].due - b[1].due)[0];
      if (!due) {
        return;
      }
      const [id, value] = due;
      this.items.delete(id);
      value.callback();
    }
  }
}

class FakeTaskApi implements TaskFeedApi {
  readonly listCalls: Deferred<TaskItem[]>[] = [];
  readonly getCalls = new Map<number, Deferred<TaskItem>[]>();
  private readonly getTotals = new Map<number, number>();

  list(): Promise<TaskItem[]> {
    const next = deferred<TaskItem[]>();
    this.listCalls.push(next);
    return next.promise;
  }

  get(id: number): Promise<TaskItem> {
    const next = deferred<TaskItem>();
    const calls = this.getCalls.get(id) ?? [];
    calls.push(next);
    this.getCalls.set(id, calls);
    this.getTotals.set(id, (this.getTotals.get(id) ?? 0) + 1);
    return next.promise;
  }

  resolveGet(id: number, task: TaskItem): void {
    const calls = this.getCalls.get(id);
    if (!calls || calls.length === 0) {
      throw new Error(`No pending get for task ${id}`);
    }
    calls.shift()!.resolve(task);
  }

  rejectGet(id: number, error: unknown): void {
    const calls = this.getCalls.get(id);
    if (!calls || calls.length === 0) {
      throw new Error(`No pending get for task ${id}`);
    }
    calls.shift()!.reject(error);
  }

  getCallCount(id: number): number {
    return this.getTotals.get(id) ?? 0;
  }
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeTask(
  id: number,
  status: TaskStatus,
  stage: TaskStage | null = null,
  patch: Partial<TaskItem> = {}
): TaskItem {
  return {
    id,
    templateId: 'travel-postcard',
    templateTitle: '旅行明信片',
    createdAt: '2026-11-06T10:00:00',
    updatedAt: '2026-11-06T10:00:00',
    status,
    stage,
    resultUrl: null,
    failureReason: null,
    ...patch
  };
}

function setup(intervalMs = 1000) {
  const api = new FakeTaskApi();
  const scheduler = new ManualScheduler();
  const snapshots: TrackedTask[][] = [];
  let loading = true;
  let listError: string | null = null;
  const feed = new TaskFeed({
    api,
    intervalMs,
    scheduler,
    onChange: (tasks) => {
      snapshots.push(tasks);
    },
    onLoadingChange: (value) => {
      loading = value;
    },
    onListErrorChange: (value) => {
      listError = value;
    }
  });
  return {
    api,
    scheduler,
    feed,
    get loading() {
      return loading;
    },
    get listError() {
      return listError;
    },
    last(): TrackedTask[] {
      return snapshots[snapshots.length - 1] ?? [];
    },
    snapshotCount(): number {
      return snapshots.length;
    }
  };
}

describe('TaskFeed', () => {
  it('keeps interleaved responses for two tasks isolated and stops polling at terminal states', async () => {
    const ctx = setup();
    ctx.feed.start();
    ctx.api.listCalls[0].resolve([
      makeTask(1, 'RUNNING', 'CHECK'),
      makeTask(2, 'RUNNING', 'GENERATE')
    ]);
    await flush();

    expect(ctx.scheduler.size).toBe(2);
    ctx.scheduler.advance(1000);
    await flush();
    expect(ctx.api.getCallCount(1)).toBe(1);
    expect(ctx.api.getCallCount(2)).toBe(1);

    // Resolve out of order: task 2 finishes first, task 1 finishes second.
    ctx.api.resolveGet(2, makeTask(2, 'FAILED', 'GENERATE', { failureReason: '模拟生成失败：演示错误' }));
    await flush();
    ctx.api.resolveGet(1, makeTask(1, 'SUCCEEDED', 'FINALIZE', { resultUrl: '/api/tasks/1/result-file' }));
    await flush();

    const byId = new Map(ctx.feed.getSnapshot().map((entry) => [entry.task.id, entry]));
    expect(byId.get(1)!.task.status).toBe('SUCCEEDED');
    expect(byId.get(1)!.task.resultUrl).toBe('/api/tasks/1/result-file');
    expect(byId.get(1)!.task.failureReason).toBeNull();
    expect(byId.get(1)!.queryError).toBeNull();

    expect(byId.get(2)!.task.status).toBe('FAILED');
    expect(byId.get(2)!.task.failureReason).toBe('模拟生成失败：演示错误');
    expect(byId.get(2)!.task.resultUrl).toBeNull();
    expect(byId.get(2)!.queryError).toBeNull();

    expect(ctx.scheduler.size).toBe(0);
    ctx.scheduler.advance(10000);
    await flush();
    expect(ctx.api.getCallCount(1)).toBe(1);
    expect(ctx.api.getCallCount(2)).toBe(1);
  });

  it('distinguishes a query error from a real backend failure and recovers on retry', async () => {
    const ctx = setup();
    ctx.feed.start();
    ctx.api.listCalls[0].resolve([makeTask(1, 'RUNNING', 'CHECK')]);
    await flush();

    ctx.scheduler.advance(1000);
    await flush();
    ctx.api.rejectGet(1, new Error('网络中断'));
    await flush();

    let entry = ctx.feed.getSnapshot()[0];
    expect(entry.task.status).toBe('RUNNING');
    expect(entry.queryError).toBe('网络中断');
    expect(entry.task.failureReason).toBeNull();
    expect(ctx.scheduler.size).toBe(0);
    ctx.scheduler.advance(10000);
    await flush();
    expect(ctx.api.getCallCount(1)).toBe(1);

    ctx.feed.retry(1);
    await flush();
    expect(ctx.api.getCallCount(1)).toBe(2);
    expect(ctx.feed.getSnapshot()[0].queryError).toBeNull();

    ctx.api.resolveGet(1, makeTask(1, 'FAILED', 'FINALIZE', { failureReason: '结果整理失败：演示错误' }));
    await flush();

    entry = ctx.feed.getSnapshot()[0];
    expect(entry.task.status).toBe('FAILED');
    expect(entry.task.failureReason).toBe('结果整理失败：演示错误');
    expect(entry.queryError).toBeNull();
    expect(ctx.scheduler.size).toBe(0);
  });

  it('a real backend failure is not presented as a query error', async () => {
    const ctx = setup();
    ctx.feed.start();
    ctx.api.listCalls[0].resolve([makeTask(9, 'RUNNING', 'GENERATE')]);
    await flush();

    ctx.scheduler.advance(1000);
    await flush();
    ctx.api.resolveGet(9, makeTask(9, 'FAILED', 'GENERATE', { failureReason: '模拟生成失败：生成器返回错误' }));
    await flush();

    const entry = ctx.feed.getSnapshot()[0];
    expect(entry.task.status).toBe('FAILED');
    expect(entry.task.failureReason).toBe('模拟生成失败：生成器返回错误');
    expect(entry.queryError).toBeNull();
    expect(ctx.api.getCallCount(9)).toBe(1);
    ctx.scheduler.advance(10000);
    await flush();
    expect(ctx.api.getCallCount(9)).toBe(1);
  });

  it('drops late responses after stop so they cannot leak into a new identity', async () => {
    const ctx = setup();
    ctx.feed.start();
    ctx.api.listCalls[0].resolve([makeTask(1, 'RUNNING', 'CHECK')]);
    await flush();

    ctx.scheduler.advance(1000);
    await flush();
    expect(ctx.api.getCallCount(1)).toBe(1);

    const beforeStop = ctx.snapshotCount();
    ctx.feed.stop();
    ctx.api.resolveGet(1, makeTask(1, 'SUCCEEDED', 'FINALIZE', { resultUrl: '/late.png' }));
    await flush();

    expect(ctx.snapshotCount()).toBe(beforeStop);
    expect(ctx.feed.getSnapshot()[0].task.status).toBe('RUNNING');
    expect(ctx.scheduler.size).toBe(0);
  });

  it('restores history on refresh and resumes tracking only unfinished tasks', async () => {
    const ctx = setup();
    ctx.feed.start();
    ctx.api.listCalls[0].resolve([
      makeTask(1, 'SUCCEEDED', 'FINALIZE', { resultUrl: '/one.png' }),
      makeTask(2, 'QUEUED', null)
    ]);
    await flush();

    expect(ctx.api.getCallCount(1)).toBe(0);
    ctx.scheduler.advance(1000);
    await flush();
    expect(ctx.api.getCallCount(1)).toBe(0);
    expect(ctx.api.getCallCount(2)).toBe(1);

    ctx.feed.refresh();
    await flush();
    ctx.api.listCalls[1].resolve([
      makeTask(1, 'SUCCEEDED', 'FINALIZE', { resultUrl: '/one.png' }),
      makeTask(3, 'RUNNING', 'GENERATE')
    ]);
    await flush();

    expect(ctx.feed.getSnapshot().map((entry) => entry.task.id)).toEqual([1, 3]);
    expect(ctx.scheduler.size).toBe(1);
    ctx.scheduler.advance(1000);
    await flush();
    expect(ctx.api.getCallCount(3)).toBe(1);
    expect(ctx.api.getCallCount(1)).toBe(0);
  });
});
