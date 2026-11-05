'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { SimulationDialog } from './SimulationDialog';

const destinations = [
  { href: '/', label: '主页', path: 'M3 10 12 3l9 7v10h-6v-7H9v7H3z' },
  { href: '/templates', label: '模板库', path: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z' },
  { href: '/history', label: '我的', path: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2' }
];

function Icon({ path }: { path: string }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={path} /></svg>;
}

export function SideNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <>
    <nav className="side-nav" aria-label="主导航">
      {destinations.map(({ href, label, path }) => (
        <Link key={href} href={href} aria-current={(pathname === href || pathname.startsWith(href + '/')) ? 'page' : undefined}>
          <Icon path={path} />{label}
        </Link>
      ))}
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon path="M3 6h4m5 0h9M3 17h10m5 0h3 M12 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0 M18 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0" />设置
      </button>
    </nav>
    <SimulationDialog open={open} onClose={close} />
  </>;
}
