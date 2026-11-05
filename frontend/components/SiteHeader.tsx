'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { initials } from '../lib/format';
import { useIdentity } from '../lib/identity';
import { AccountDialog } from './AccountDialog';

export function SiteHeader() {
  const { user, status, error, retry, switching } = useIdentity();
  const [accountOpen, setAccountOpen] = useState(false);
  const closeAccount = useCallback(() => setAccountOpen(false), []);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="光影工坊首页">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand-text">
            <strong>光影工坊</strong>
          </span>
        </Link>


        <div className="header-account">
          {status === 'loading' && <span className="header-hint">身份加载中…</span>}
          {status === 'error' && (
            <button type="button" className="button ghost small" onClick={retry}>
              身份异常 · 重试
            </button>
          )}
          {status === 'ready' && user && (
            <button
              type="button"
              className="account-button"
              onClick={() => setAccountOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={accountOpen}
              aria-label={`当前演示身份 ${user.displayName}，切换身份`}
            >
              <span
                className="avatar avatar-small"
                style={{ backgroundColor: user.avatarColor }}
                aria-hidden="true"
              >
                {initials(user.displayName)}
              </span>
              <span className="account-name">{user.displayName}</span>
              {switching && <span className="spinner" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      <AccountDialog open={accountOpen} onClose={closeAccount} />

      {error && status === 'ready' && <p className="header-error">{error}</p>}
    </header>
  );
}
