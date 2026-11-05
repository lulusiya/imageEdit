import type {
  AcceptedTask,
  ApiErrorBody,
  AssetUploadResult,
  CategorySummary,
  DemoIdentity,
  DemoUser,
  SimulationSettings,
  TaskItem,
  TemplateDetail,
  TemplateSummary
} from './types';
import type { TaskFeedApi } from './taskFeed';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: 'same-origin'
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError(0, 'NETWORK_ERROR', '网络连接失败，请确认服务是否可用');
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    throw new ApiError(
      response.status,
      body?.code ?? 'HTTP_ERROR',
      body?.message ?? `请求失败（HTTP ${response.status}）`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function getSession(signal?: AbortSignal): Promise<{ user: DemoUser }> {
  return request('/api/session', { signal });
}

export function createDemoSession(identity: DemoIdentity, signal?: AbortSignal): Promise<{ user: DemoUser }> {
  return request('/api/demo-session', {
    method: 'POST',
    body: JSON.stringify({ identity }),
    signal
  });
}

export function getCategories(signal?: AbortSignal): Promise<CategorySummary[]> {
  return request('/api/categories', { signal });
}

export function getTemplates(category?: string, signal?: AbortSignal): Promise<TemplateSummary[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/api/templates${query}`, { signal });
}

export function getTemplate(id: string, signal?: AbortSignal): Promise<TemplateDetail> {
  return request(`/api/templates/${encodeURIComponent(id)}`, { signal });
}

export function uploadAsset(templateId: string, file: File, signal?: AbortSignal): Promise<AssetUploadResult> {
  const body = new FormData();
  body.append('templateId', templateId);
  body.append('file', file);
  return request('/api/assets', { method: 'POST', body, signal });
}

export function createTask(templateId: string, assetIds: string[]): Promise<AcceptedTask> {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ templateId, assetIds })
  });
}

export function getTasks(signal?: AbortSignal): Promise<TaskItem[]> {
  return request('/api/tasks', { signal });
}

export function getTask(id: number, signal?: AbortSignal): Promise<TaskItem> {
  return request(`/api/tasks/${id}`, { signal });
}

export function getSimulation(signal?: AbortSignal): Promise<SimulationSettings> {
  return request('/api/dev/simulation', { signal });
}

export function updateSimulation(
  settings: Partial<SimulationSettings>,
  signal?: AbortSignal
): Promise<SimulationSettings> {
  return request('/api/dev/simulation', {
    method: 'PUT',
    body: JSON.stringify(settings),
    signal
  });
}

export const taskFeedApi: TaskFeedApi = {
  list: (signal?: AbortSignal) => getTasks(signal),
  get: (id: number, signal?: AbortSignal) => getTask(id, signal)
};
