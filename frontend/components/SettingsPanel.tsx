'use client';

import { useLanguage } from '../lib/language';
import { useCallback, useEffect, useState } from 'react';
import { errorMessage, getSimulation, isAbortError, updateSimulation } from '../lib/api';
import { initials } from '../lib/format';
import { useIdentity } from '../lib/identity';
import type { SimulationSettings, TaskStage } from '../lib/types';
import { AccountDialog } from './AccountDialog';

type HistoryView = 'row' | 'grid';
const VIEW_STORAGE_KEY = 'studio-history-view';
const MAX_DELAY_MS = 600000;

interface Draft {
  checkDelayMs: string;
  generateDelayMs: string;
  finalizeDelayMs: string;
  failStage: '' | TaskStage;
}

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

export function SettingsPanel() {
  const { t, lang, toggle } = useLanguage();
  const { user, status, error, retry } = useIdentity();
  const [accountOpen, setAccountOpen] = useState(false);
  const [historyView, setHistoryView] = useState<HistoryView>('row');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const closeAccount = useCallback(() => setAccountOpen(false), []);

  useEffect(() => {
    if (localStorage.getItem(VIEW_STORAGE_KEY) === 'grid') {
      setHistoryView('grid');
    }
  }, []);

  const chooseView = (next: HistoryView) => {
    setHistoryView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  useEffect(() => {
    if (status !== 'ready') {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    getSimulation(controller.signal)
      .then((settings) => {
        setDraft(toDraft(settings));
      })
      .catch((loadFailure) => {
        if (!isAbortError(loadFailure)) {
          setLoadError(errorMessage(loadFailure, '读取演示设置失败'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [status]);

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
    } catch (saveFailure) {
      setSaveError(errorMessage(saveFailure, '保存演示设置失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="section-heading">
        <div>
          <h1 id="settings-title">{t('设置')}</h1>
          <p className="settings-intro">{t('偏好与演示控制')}</p>
        </div>
      </div>

      <section className="settings-card" aria-labelledby="settings-account">
        <header>
          <h2 id="settings-account">{t('账户')}</h2>
          <p>{t('当前演示身份与账户等级')}</p>
        </header>
        {status === 'loading' && (
          <div className="modal-status">
            <span className="spinner" aria-hidden="true" />{t('身份加载中…')}
          </div>
        )}
        {status === 'error' && (
          <div className="banner banner-error" role="alert">
            <span>{t(error ?? '无法建立演示身份')}</span>
            <button type="button" className="button ghost small" onClick={retry}>{t('重试')}</button>
          </div>
        )}
        {status === 'ready' && user && (
          <div className="settings-account-row">
            <div className="profile-card">
              <div
                className="avatar avatar-large"
                style={{ backgroundColor: user.avatarColor }}
                aria-hidden="true"
              >
                {initials(user.displayName)}
              </div>
              <div>
                <strong>{t(user.displayName)}</strong>
                <p>{user.email}</p>
                <span className="profile-tag">{t('当前身份')}</span>
                <span className={`tier-badge ${user.accountTier === 'PREMIUM' ? 'premium' : ''}`}>
                  {t(user.accountTier === 'PREMIUM' ? '高级用户' : '普通用户')}
                </span>
              </div>
            </div>
            <button type="button" className="button ghost small" onClick={() => setAccountOpen(true)}>
              {t('切换身份')}
            </button>
          </div>
        )}
      </section>

      <section className="settings-card" aria-labelledby="settings-general">
        <header>
          <h2 id="settings-general">{t('通用设置')}</h2>
        </header>
        <div className="settings-row">
          <div className="settings-row-text">
            <strong>{t('界面语言')}</strong>
            <span>{t('切换站点的显示语言')}</span>
          </div>
          <div className="segmented" role="group" aria-label={t('界面语言')}>
            <button
              type="button"
              className={lang === 'zh' ? 'active' : ''}
              aria-pressed={lang === 'zh'}
              onClick={() => {
                if (lang !== 'zh') toggle();
              }}
            >
              中文
            </button>
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              aria-pressed={lang === 'en'}
              onClick={() => {
                if (lang !== 'en') toggle();
              }}
            >
              English
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-text">
            <strong>{t('历史默认视图')}</strong>
            <span>{t('模板详情页中历史作品的默认展示方式')}</span>
          </div>
          <div className="segmented" role="group" aria-label={t('历史默认视图')}>
            <button
              type="button"
              className={historyView === 'row' ? 'active' : ''}
              aria-pressed={historyView === 'row'}
              onClick={() => chooseView('row')}
            >
              {t('横向排列')}
            </button>
            <button
              type="button"
              className={historyView === 'grid' ? 'active' : ''}
              aria-pressed={historyView === 'grid'}
              onClick={() => chooseView('grid')}
            >
              {t('网格排列')}
            </button>
          </div>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-demo">
        <header>
          <h2 id="settings-demo">{t('演示控制')}</h2>
          <p>{t('调整模拟任务各阶段的耗时，并可注入确定性失败。')}</p>
        </header>
        {loading && (
          <div className="modal-status">
            <span className="spinner" aria-hidden="true" />{t('正在读取当前设置…')}
          </div>
        )}
        {loadError && (
          <div className="banner banner-error" role="alert">{t(loadError)}</div>
        )}
        {draft && (
          <div className="simulation-form">
            <div className="form-grid">
              <label className="field">
                <span>{t('素材检查延迟（毫秒）')}</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_DELAY_MS}
                  step={100}
                  value={draft.checkDelayMs}
                  onChange={(event) => setDraft({ ...draft, checkDelayMs: event.target.value })}
                />
              </label>
              <label className="field">
                <span>{t('模拟生成延迟（毫秒）')}</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_DELAY_MS}
                  step={100}
                  value={draft.generateDelayMs}
                  onChange={(event) => setDraft({ ...draft, generateDelayMs: event.target.value })}
                />
              </label>
              <label className="field">
                <span>{t('结果整理延迟（毫秒）')}</span>
                <input
                  type="number"
                  min={0}
                  max={MAX_DELAY_MS}
                  step={100}
                  value={draft.finalizeDelayMs}
                  onChange={(event) => setDraft({ ...draft, finalizeDelayMs: event.target.value })}
                />
              </label>
              <label className="field">
                <span>{t('确定性失败注入')}</span>
                <select
                  value={draft.failStage}
                  onChange={(event) => setDraft({ ...draft, failStage: event.target.value as '' | TaskStage })}
                >
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value || 'none'} value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {saveError && (
              <div className="banner banner-error" role="alert">{t(saveError)}</div>
            )}
            {saved && (
              <div className="banner banner-success" role="status">{t('设置已保存')}</div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {t(saving ? '保存中…' : '保存设置')}
              </button>
            </div>
          </div>
        )}
      </section>

      <AccountDialog open={accountOpen} onClose={closeAccount} />
    </div>
  );
}
