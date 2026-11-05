import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { IdentityProvider } from '../lib/identity';
import { TaskHistoryProvider } from '../lib/taskHistory';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

export const metadata: Metadata = {
  title: {
    default: '光影工坊 · 素材制作',
    template: '%s · 光影工坊'
  },
  description:
    '选择一个模板，上传素材，提交异步生成任务，实时查看素材检查、模拟生成与结果整理的完整流程。',
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport: Viewport = {
  themeColor: '#0a0b0d',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <IdentityProvider>
          <TaskHistoryProvider>
            <SiteHeader />
            <main className="site-main">{children}</main>
            <SiteFooter />
          </TaskHistoryProvider>
        </IdentityProvider>
      </body>
    </html>
  );
}
