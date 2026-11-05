'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createTask, errorMessage, isAbortError, uploadAsset } from '../lib/api';
import { formatFileSize, mimeTypeLabel } from '../lib/format';
import { useTaskHistory } from '../lib/taskHistory';
import type { AssetUploadResult, TaskItem, TemplateDetail } from '../lib/types';

interface SlotState {
  file: File | null;
  previewUrl: string | null;
  asset: AssetUploadResult | null;
  uploading: boolean;
  error: string | null;
}

function emptySlot(): SlotState {
  return { file: null, previewUrl: null, asset: null, uploading: false, error: null };
}

function validateFile(file: File, detail: TemplateDetail): string | null {
  if (file.size === 0) {
    return '文件为空，请重新选择';
  }
  if (file.size > detail.maxFileSizeBytes) {
    return `文件不能超过 ${formatFileSize(detail.maxFileSizeBytes)}`;
  }
  if (!detail.acceptedMimeTypes.includes(file.type)) {
    return `仅支持 ${detail.acceptedMimeTypes.map(mimeTypeLabel).join(' / ')} 格式`;
  }
  return null;
}

export function TemplateWorkspace({ detail }: { detail: TemplateDetail }) {
  const { addTask } = useTaskHistory();
  const [slots, setSlots] = useState<SlotState[]>(() =>
    Array.from({ length: detail.requiredImageCount }, emptySlot)
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<TaskItem | null>(null);
  const tokensRef = useRef<number[]>(Array.from({ length: detail.requiredImageCount }, () => 0));
  const controllersRef = useRef<Array<AbortController | null>>(
    Array.from({ length: detail.requiredImageCount }, () => null)
  );
  const urlsRef = useRef<Array<string | null>>(
    Array.from({ length: detail.requiredImageCount }, () => null)
  );

  useEffect(() => {
    const tokens = tokensRef.current;
    const controllers = controllersRef.current;
    const urls = urlsRef.current;
    return () => {
      tokens.forEach((token, index) => {
        tokens[index] = token + 1;
      });
      controllers.forEach((controller) => controller?.abort());
      urls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const releaseSlot = useCallback((index: number) => {
    tokensRef.current[index] = (tokensRef.current[index] ?? 0) + 1;
    controllersRef.current[index]?.abort();
    controllersRef.current[index] = null;
    const url = urlsRef.current[index];
    if (url) {
      URL.revokeObjectURL(url);
      urlsRef.current[index] = null;
    }
  }, []);

  const handleSelect = useCallback(
    (index: number, file: File | null) => {
      if (!file) {
        return;
      }
      const validation = validateFile(file, detail);
      if (validation) {
        setSlots((previous) =>
          previous.map((slot, slotIndex) =>
            slotIndex === index ? { ...slot, error: validation } : slot
          )
        );
        return;
      }

      const token = (tokensRef.current[index] ?? 0) + 1;
      tokensRef.current[index] = token;
      controllersRef.current[index]?.abort();
      const controller = new AbortController();
      controllersRef.current[index] = controller;

      const previousUrl = urlsRef.current[index];
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current[index] = previewUrl;

      setSlots((previous) =>
        previous.map((slot, slotIndex) =>
          slotIndex === index
            ? { file, previewUrl, asset: null, uploading: true, error: null }
            : slot
        )
      );
      setSubmitted(null);

      uploadAsset(detail.id, file, controller.signal)
        .then((asset) => {
          if (token !== tokensRef.current[index]) {
            return;
          }
          setSlots((previous) =>
            previous.map((slot, slotIndex) =>
              slotIndex === index ? { ...slot, asset, uploading: false, error: null } : slot
            )
          );
        })
        .catch((error) => {
          if (token !== tokensRef.current[index] || isAbortError(error)) {
            return;
          }
          setSlots((previous) =>
            previous.map((slot, slotIndex) =>
              slotIndex === index
                ? {
                    ...slot,
                    uploading: false,
                    error: errorMessage(error, '素材上传失败，请重试')
                  }
                : slot
            )
          );
        })
        .finally(() => {
          if (controllersRef.current[index] === controller) {
            controllersRef.current[index] = null;
          }
        });
    },
    [detail]
  );

  const handleRemove = useCallback(
    (index: number) => {
      releaseSlot(index);
      setSlots((previous) =>
        previous.map((slot, slotIndex) => (slotIndex === index ? emptySlot() : slot))
      );
    },
    [releaseSlot]
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) {
      return;
    }
    const ready = slots.every((slot) => slot.asset && !slot.uploading && !slot.error);
    if (!ready) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitted(null);
    try {
      const accepted = await createTask(
        detail.id,
        slots.map((slot) => slot.asset!.assetId)
      );
      const task: TaskItem = {
        id: accepted.taskId,
        templateId: detail.id,
        templateTitle: detail.title,
        createdAt: accepted.createdAt,
        updatedAt: accepted.createdAt,
        status: accepted.status,
        stage: null,
        resultUrl: null,
        failureReason: null
      };
      addTask(task);
      setSubmitted(task);
      slots.forEach((_, index) => releaseSlot(index));
      setSlots(Array.from({ length: detail.requiredImageCount }, emptySlot));
    } catch (error) {
      setSubmitError(errorMessage(error, '任务提交失败，请稍后重试'));
    } finally {
      setSubmitting(false);
    }
  }, [addTask, detail, releaseSlot, slots, submitting]);

  const uploadedCount = slots.filter((slot) => slot.asset && !slot.uploading).length;
  const canSubmit =
    slots.length > 0 &&
    slots.every((slot) => slot.asset && !slot.uploading && !slot.error) &&
    !submitting;

  return (
    <div className="workspace">
      <div className="workspace-heading">
        <div>
          <h2>上传素材</h2>
        </div>
        <span className="workspace-requirement">
          需要 {detail.requiredImageCount} 张 · 单张不超过{' '}
          {formatFileSize(detail.maxFileSizeBytes)}
        </span>
      </div>

      <p className="workspace-hint">
        支持 {detail.acceptedMimeTypes.map(mimeTypeLabel).join(' / ')}
        服务端会再次校验文件类型与可解码性。
      </p>

      <div className={`upload-slots upload-slots-${Math.min(detail.requiredImageCount, 3)}`}>
        {slots.map((slot, index) => {
          const inputId = `${detail.id}-slot-${index}`;
          return (
            <div
              key={inputId}
              className={`upload-slot ${slot.previewUrl ? 'has-image' : ''} ${
                slot.error ? 'has-error' : ''
              }`}
            >
              <input
                id={inputId}
                type="file"
                className="visually-hidden"
                accept={detail.acceptedMimeTypes.join(',')}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = '';
                  handleSelect(index, file);
                }}
              />
              {slot.previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.previewUrl}
                    alt={`素材 ${index + 1} 预览`}
                    className="slot-preview"
                  />
                  <div className="slot-overlay">
                    <span className={`slot-status ${slot.asset ? 'slot-ok' : ''}`}>
                      {slot.uploading
                        ? '上传中…'
                        : slot.asset
                          ? `已上传 · ${formatFileSize(slot.asset.sizeBytes)}`
                          : '等待重试'}
                    </span>
                    <div className="slot-actions">
                      <label htmlFor={inputId} className="slot-button">
                        更换
                      </label>
                      <button
                        type="button"
                        className="slot-button danger"
                        onClick={() => handleRemove(index)}
                      >
                        移除
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <label htmlFor={inputId} className="slot-empty">
                  <span className="slot-plus" aria-hidden="true">
                    +
                  </span>
                  <span>上传素材 {index + 1}</span>
                </label>
              )}
              {slot.error && (
                <p className="slot-error" role="alert">
                  {slot.error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="submit-row">
        <div className="submit-meta">
          <strong>
            {uploadedCount} / {slots.length} 张素材已就绪
          </strong>
        </div>
        <button
          type="button"
          className="button primary"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
        >
          {submitting ? '提交中…' : '开始制作'}
        </button>
      </div>

      {submitError && (
        <div className="banner banner-error" role="alert">
          {submitError}
        </div>
      )}

      {submitted && (
        <div className="banner banner-success submit-success" role="status">
          <div>
            <strong>任务 #{submitted.id} 已提交</strong>
          </div>
          <div className="submit-success-actions">
            <button
              type="button"
              className="button ghost small"
              onClick={() => setSubmitted(null)}
            >
              继续制作
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
