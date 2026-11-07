'use client';

import { useLanguage } from '../lib/language';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage } from '../lib/api';
import { initials } from '../lib/format';
import { useIdentity } from '../lib/identity';
import type { DemoIdentity } from '../lib/types';

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
}

const IDENTITY_OPTIONS: Array<{
  identity: DemoIdentity;
  userId: string;
  name: string;
  role: string;
  description: string;
  color: string;
  tier: 'PREMIUM' | 'STANDARD';
}> = [
  {
    identity: 'A',
    userId: 'user-a',
    name: '林小满',
    role: '演示用户 A',
    description: '常用旅行纪念与萌宠日常模板',
    color: '#9BBF3E',
    tier: 'PREMIUM'
  },
  {
    identity: 'B',
    userId: 'user-b',
    name: '周予安',
    role: '演示用户 B',
    description: '常用婚礼庆典与创意海报模板',
    color: '#6C8AE4',
    tier: 'STANDARD'
  }
];

export function AccountDialog({ open, onClose }: AccountDialogProps) {
  const { t } = useLanguage();
  const { user, status, error, switching, switchIdentity, retry } = useIdentity();
  const [actionError, setActionError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    setActionError(null);
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  const handleSwitch = async (identity: DemoIdentity) => {
    setActionError(null);
    try {
      await switchIdentity(identity);
    } catch (switchError) {
      setActionError(errorMessage(switchError, '身份切换失败，请重试'));
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
        className="modal account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
      >
        <header className="modal-header">
          <div>
            <h2 id="account-dialog-title">{t("演示身份")}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={t("关闭身份窗口")}
            onClick={onClose}
            ref={closeButtonRef}
          >
            ×
          </button>
        </header>


        {status === 'loading' && (
          <div className="modal-status">
            <span className="spinner" aria-hidden="true" />{t("正在建立演示身份…")}</div>
        )}

        {status === 'error' && (
          <div className="banner banner-error" role="alert">
            <span>{t(error ?? '无法建立演示身份')}</span>
            <button type="button" className="button ghost small" onClick={retry}>{t("重试")}</button>
          </div>
        )}

        {status === 'ready' && user && (
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
              <span className="profile-tag">{t("当前身份")}</span>
              <span className={`tier-badge ${user.accountTier === 'PREMIUM' ? 'premium' : ''}`}>
                {t(user.accountTier === 'PREMIUM' ? '高级用户' : '普通用户')}
              </span>
            </div>
          </div>
        )}

        <div className="identity-options" role="group" aria-label={t("切换演示身份")}>
          {IDENTITY_OPTIONS.map((option) => {
            const isCurrent = user?.id === option.userId;
            return (
              <button
                key={option.identity}
                type="button"
                className={`identity-option ${isCurrent ? 'current' : ''}`}
                onClick={() => void handleSwitch(option.identity)}
                disabled={switching || isCurrent || status !== 'ready'}
              >
                <span
                  className="avatar"
                  style={{ backgroundColor: option.color }}
                  aria-hidden="true"
                >
                  {initials(option.name)}
                </span>
                <span className="identity-option-body">
                  <strong>
                    {t(option.name)}
                    <span className="identity-tag">{option.identity}</span>
                  </strong>
                  <span className={`tier-badge ${option.tier === 'PREMIUM' ? 'premium' : ''}`}>
                    {t(option.tier === 'PREMIUM' ? '高级用户' : '普通用户')}
                  </span>
                </span>
                <span className="identity-option-state">
                  {t(isCurrent ? '当前' : switching ? '切换中' : '切换')}
                </span>
              </button>
            );
          })}
        </div>

        {actionError && (
          <div className="banner banner-error" role="alert">
            {t(actionError)}
          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
