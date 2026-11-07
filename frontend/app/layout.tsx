import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { LanguageProvider } from '../lib/language';
import { IdentityProvider } from '../lib/identity';
import { TaskHistoryProvider } from '../lib/taskHistory';
import { SiteHeader } from '../components/SiteHeader';
import { SideNav } from '../components/SideNav';

export const metadata: Metadata = {
  title: {
    default: 'Frame Studio',
    template: '%s · Frame Studio'
  },
  description:
    'Create images from photo templates.',
  icons: {
    icon: { url: '/app-icon.svg', type: 'image/svg+xml' }
  }
};

export const viewport: Viewport = {
  themeColor: '#0a0b0d',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider><IdentityProvider>
          <TaskHistoryProvider>
            <SiteHeader />
            <SideNav />
            <main className="site-main">{children}</main>
          </TaskHistoryProvider>
        </IdentityProvider></LanguageProvider>
      </body>
    </html>
  );
}
