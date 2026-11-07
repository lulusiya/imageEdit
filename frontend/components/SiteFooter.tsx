'use client';

import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>光影工坊</p>
        <Link className="footer-link" href="/settings">
          演示设置
        </Link>
      </div>
    </footer>
  );
}
