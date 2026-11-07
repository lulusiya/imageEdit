'use client';

import { samplePhotoUrl, samplePhotos } from '../lib/samplePhotos';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/language';
import type { TemplateSummary } from '../lib/types';

export function Showcase({ templates }: { templates: TemplateSummary[] }) {
  const { lang, t } = useLanguage();
  const featured = templates.filter(template => ['travel-postcard', 'pet-portrait', 'wedding-invite'].includes(template.id));
  const slides = [...(featured.length ? featured : templates), null];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (paused || focused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, focused, slides.length]);
  const slide = slides[index % slides.length];
  const english = lang === 'en';
  const photo = slide ? samplePhotos(slide.category, slide.id)[0] : 'winter-evergreen';
  const photoUrl = photo ? samplePhotoUrl(photo) : slide?.coverUrl;
  const layout = !slide ? 'news' : slide.id === 'travel-postcard' ? 'panorama' : slide.id === 'wedding-invite' ? 'portrait' : 'split';

  return <section className="showcase" aria-label={english ? 'Highlights' : '首页精选'}
    onFocus={() => setFocused(true)} onBlur={e => setFocused(e.currentTarget.contains(e.relatedTarget))}>
    <Link className={`showcase-slide showcase-${layout}`} href={slide ? '/templates/' + slide.id : '/templates'}>
      <div className="showcase-copy">
        <span>{slide ? t(slide.category) : english ? 'Fictional product news' : '虚构产品资讯'}</span>
        <h2>{slide ? t(slide.title) : english ? 'The Winter Edit' : '冬日影像特刊'}</h2>
        {!slide && <p>{english ? 'A concept collection of winter cards and keepsakes.' : '一组以冬日贺卡和纪念照为主题的概念作品。'}</p>}
        <span className="showcase-cta">{slide ? (english ? 'Use template' : '使用模板') : (english ? 'Browse templates' : '浏览模板')} →</span>
      </div>
      <figure className="showcase-photos">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt="" />
      </figure>
    </Link>
    <div className="showcase-controls">
      <button aria-label={lang === 'en' ? 'Previous' : '上一张'} onClick={() => setIndex(i => (i + slides.length - 1) % slides.length)}>‹</button>
      <button aria-label={lang === 'en' ? 'Pause rotation' : '暂停轮播'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? '▶' : 'Ⅱ'}</button>
      <button aria-label={lang === 'en' ? 'Next' : '下一张'} onClick={() => setIndex(i => (i + 1) % slides.length)}>›</button>
    </div>
  </section>;
}
