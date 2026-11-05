export type DemoIdentity = 'A' | 'B';

export interface DemoUser {
  id: string;
  displayName: string;
  email: string;
  avatarColor: string;
}

export interface CategorySummary {
  name: string;
  count: number;
}

export interface TemplateSummary {
  id: string;
  title: string;
  category: string;
  coverUrl: string;
  requiredImageCount: number;
}

export interface TemplateDetail extends TemplateSummary {
  description: string;
  acceptedMimeTypes: string[];
  maxFileSizeBytes: number;
  sampleResultUrl: string;
}

export type TaskStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
export type TaskStage = 'CHECK' | 'GENERATE' | 'FINALIZE';

export interface TaskItem {
  id: number;
  templateId: string;
  templateTitle: string;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  stage: TaskStage | null;
  resultUrl: string | null;
  failureReason: string | null;
}

export interface AssetUploadResult {
  assetId: string;
  previewUrl: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
}

export interface AcceptedTask {
  taskId: number;
  status: TaskStatus;
  createdAt: string;
}

export interface SimulationSettings {
  checkDelayMs: number;
  generateDelayMs: number;
  finalizeDelayMs: number;
  failStage: TaskStage | null;
}

export interface ApiErrorBody {
  code?: string;
  message?: string;
}
