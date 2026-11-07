'use client';

import { useLanguage } from '../lib/language';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { initials } from '../lib/format';
import { useIdentity } from '../lib/identity';
import { AccountDialog } from './AccountDialog';

export function SiteHeader() {
  const { lang, toggle, t } = useLanguage();
  const { user, status, error, retry, switching } = useIdentity();
  const [accountOpen, setAccountOpen] = useState(false);
  const closeAccount = useCallback(() => setAccountOpen(false), []);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={t("光影工坊首页")}>
          <img className="brand-mark" src="/app-icon.svg" alt="" aria-hidden="true" />
          <span className="brand-text">
            <strong>{t("光影工坊")}</strong>
          </span>
        </Link>


        <div className="header-account">
          <button type="button" className="language-switch" aria-label={t(lang === "en" ? "切换到中文" : "Switch to English")} onClick={toggle}>{t(lang === "en" ? "中文" : "English")}</button>
          {status === 'loading' && <span className="header-hint">{t("身份加载中…")}</span>}
          {status === 'error' && (
            <button type="button" className="button ghost small" onClick={retry}>{t("身份异常 · 重试")}</button>
          )}
          {status === 'ready' && user && (
            <button
              type="button"
              className="account-button"
              onClick={() => setAccountOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={accountOpen}
              aria-label={t("切换身份")}
            >
              <span
                className="avatar avatar-small"
                style={{ backgroundColor: user.avatarColor }}
                aria-hidden="true"
              >
                {initials(user.displayName)}
              </span>
              <span className={`tier-badge ${user.accountTier === 'PREMIUM' ? 'premium' : ''}`}>
                {t(user.accountTier === 'PREMIUM' ? '高级用户' : '普通用户')}
              </span>
              <span className="account-name">{t(user.displayName)}</span>
              {switching && <span className="spinner" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      <AccountDialog open={accountOpen} onClose={closeAccount} />

      {error && status === 'ready' && <p className="header-error">{t(error)}</p>}
    </header>
  );
}
