'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { english, shortDescriptions } from './messages';

type Language = 'en' | 'zh';
interface Locale {
  lang: Language;
  toggle(): void;
  t(value: string | null | undefined): string;
}
const Context = createContext<Locale | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  useEffect(() => {
    if (localStorage.getItem('studio-language') === 'zh') setLang('zh');
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh' ? '光影工坊' : 'Frame Studio';
  }, [lang]);

  function toggle() {
    const next = lang === 'en' ? 'zh' : 'en';
    localStorage.setItem('studio-language', next);
    setLang(next);
  }
  function t(value: string | null | undefined) {
    if (!value) return '';
    if (lang === 'zh') return shortDescriptions[value] ?? value;
    return english[value] ?? value
      .replace(/^文件不能超过 /, 'Maximum file size: ')
      .replace(/^仅支持 (.+) 格式$/, 'Supported formats: $1')
      .replace(/^.+ 需要是 0 到 (\d+) 之间的整数毫秒数$/, 'Enter a whole number between 0 and $1 ms.');
  }
  return <Context.Provider value={{ lang, toggle, t }}>{children}</Context.Provider>;
}

export function useLanguage() {
  const locale = useContext(Context);
  if (!locale) throw new Error('LanguageProvider required');
  return locale;
}
