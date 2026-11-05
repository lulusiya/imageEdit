'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage, getSimulation, isAbortError, updateSimulation } from '../lib/api';
import type { SimulationSettings, TaskStage } from '../lib/types';

interface SimulationDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Draft {
  checkDelayMs: string;
  generateDelayMs: string;
  finalizeDelayMs: string;
  failStage: '' | TaskStage;
}

const MAX_DELAY_MS = 600000;

const STAGE_OPTIONS: Array<{ value: '' | TaskStage; label: string }> = [
  { value: '', label: '不注入失败' },
  { value: 'CHECK', label: '素材检查阶段失败' },
  { value: 'GENERATE', label: '模拟生成阶段失败' },
  { value: 'FINALIZE', label: '结果整理阶段失败' }
];

function toDraft(settings: SimulationSettings): Draft {
  return {
    checkDelayMs: String(settings.checkDelayMs),
    generateDelayMs: String(settings.generateDelayMs),
    finalizeDelayMs: String(settings.finalizeDelayMs),
    failStage: (settings.failStage ?? '') as '' | TaskStage
  };
}

function parseDelay(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_DELAY_MS) {
    throw new Error(`${label} 需要是 0 到 ${MAX_DELAY_MS} 之间的整数毫秒数`);
  }
  return parsed;
}

export function SimulationDialog({ open, onClose }: SimulationDialogProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(null);
    setSaveError(null);
    setSaved(false);
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    getSimulation(controller.signal)
      .then((settings) => {
        setDraft(toDraft(settings));
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          setLoadError(errorMessage(error, '读取演示设置失败'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSave = async () => {
    if (!draft) {
      return;
    }
    setSaveError(null);
    setSaved(false);
    let payload: SimulationSettings;
    try {
      payload = {
        checkDelayMs: parseDelay(draft.checkDelayMs, '素材检查延迟'),
        generateDelayMs: parseDelay(draft.generateDelayMs, '模拟生成延迟'),
        finalizeDelayMs: parseDelay(draft.finalizeDelayMs, '结果整理延迟'),
        failStage: draft.failStage || null
      };
    } catch (validationError) {
      setSaveError(errorMessage(validationError, '请检查输入'));
      return;
    }
    setSaving(true);
    try {
      const next = await updateSimulation(payload);
      setDraft(toDraft(next));
      setSaved(true);
    } catch (error) {
      setSaveError(errorMessage(error, '保存演示设置失败'));
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal simulation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-dialog-title"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">DEMO CONTROLS</p>
            <h2 id="simulation-dialog-title">演示设置</h2>
          </div>
          <button type="button" className="icon-button" aria-label="关闭演示设置" onClick={onClose}>
            ×
          </button>
        </header>

        <p className="modal-copy">
          调整三个阶段的目标耗时，或指定一个固定失败阶段。设置会在任务受理时快照，只影响之后提交的任务。
        </p>

        {loading && (
          <div className="modal-status">
            <span className="spinner" aria-hidden="true" />
            正在读取当前设置…
          </div>
        )}

        {loadError && (
          <div className="banner banner-error" role="alert">
            {loadError}
          </div>
        )}

        {draft && (
          <div className="simulation-form">
            <div className="form-grid">
              <label className="field">
                <span>素材检查延迟（毫秒）</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_DELAY_MS}
                  step={100}
                  value={draft.checkDelayMs}
                  onChange={(event) =>
                    setDraft({ ...draft, checkDelayMs: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>模拟生成延迟（毫秒）</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_DELAY_MS}
                  step={100}
                  value={draft.generateDelayMs}
                  onChange={(event) =>
                    setDraft({ ...draft, generateDelayMs: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>结果整理延迟（毫秒）</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_DELAY_MS}
                  step={100}
                  value={draft.finalizeDelayMs}
                  onChange={(event) =>
                    setDraft({ ...draft, finalizeDelayMs: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>确定性失败注入</span>
                <select
                  value={draft.failStage}
                  onChange={(event) =>
                    setDraft({ ...draft, failStage: event.target.value as '' | TaskStage })
                  }
                >
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value || 'none'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="form-hint">
              失败注入会让新任务停在指定阶段并写入明确原因，用于验证“查询失败”和“后端业务失败”在界面上的区分。
            </p>

            {saveError && (
              <div className="banner banner-error" role="alert">
                {saveError}
              </div>
            )}
            {saved && (
              <div className="banner banner-success" role="status">
                设置已保存，新提交的任务将使用该配置。
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="button ghost" onClick={onClose}>
                关闭
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? '保存中…' : '保存设置'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
