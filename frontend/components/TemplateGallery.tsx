'use client';

import { useLanguage } from '../lib/language';
import { useEffect, useState } from 'react';
import { Showcase } from './Showcase';
import Link from 'next/link';
import { TemplateCard } from './TemplateCard';
import { errorMessage, getCategories, getTemplates, isAbortError } from '../lib/api';
import type { CategorySummary, TemplateSummary } from '../lib/types';

export function TemplateGallery({ featured = false }: { featured?: boolean }) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategorySummary[] | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesReload, setCategoriesReload] = useState(0);

  const [category, setCategory] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templatesReload, setTemplatesReload] = useState(0);

  useEffect(() => {
    if (featured) return;
    const controller = new AbortController();
    setCategoriesError(null);
    getCategories(controller.signal)
      .then((list) => setCategories(list))
      .catch((error) => {
        if (!isAbortError(error)) {
          setCategoriesError(errorMessage(error, '分类加载失败'));
        }
      });
    return () => controller.abort();
  }, [categoriesReload, featured]);

  useEffect(() => {
    const controller = new AbortController();
    setTemplates(null);
    setTemplatesError(null);
    getTemplates(category ?? undefined, controller.signal)
      .then((list) => setTemplates(list))
      .catch((error) => {
        if (!isAbortError(error)) {
          setTemplatesError(errorMessage(error, '模板加载失败'));
        }
      });
    return () => controller.abort();
  }, [category, templatesReload]);

  const visibleTemplates = featured ? templates?.slice(0, 5) : templates;

  return (
    <div className="home-page">
      {featured && templates && templates.length > 0 && <Showcase templates={templates} />}
      <section id="templates" className="templates-section" aria-labelledby="templates-title">
        <div className="gallery-heading"><h1 id="templates-title">{t(featured ? '精选模板' : '模板库')}</h1>
          {featured && <Link href="/templates">{t("查看全部 →")}</Link>}
        </div>
        {!featured && <div className="category-bar" role="group" aria-label={t("按分类筛选模板")}>
          <button
            type="button"
            className={`category-pill ${category === null ? 'active' : ''}`}
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
          >{t("全部")}</button>
          {(categories ?? []).map((item) => (
            <button
              key={t(item.name)}
              type="button"
              className={`category-pill ${category === item.name ? 'active' : ''}`}
              aria-pressed={category === item.name}
              onClick={() => setCategory(item.name)}
            >
              {t(item.name)}
            </button>
          ))}
          {categories === null && categoriesError === null && (
            <>
              <span className="skeleton pill-skeleton" />
              <span className="skeleton pill-skeleton" />
              <span className="skeleton pill-skeleton" />
            </>
          )}
          {categoriesError && (
            <button
              type="button"
              className="category-error"
              onClick={() => setCategoriesReload((value) => value + 1)}
            >{t("分类加载失败，点击重试")}</button>
          )}
        </div>}

        {templatesError && (
          <div className="banner banner-error" role="alert">
            <span>{t(templatesError)}</span>
            <button
              type="button"
              className="button ghost small"
              onClick={() => setTemplatesReload((value) => value + 1)}
            >{t("重新加载")}</button>
          </div>
        )}

        {!templatesError && templates === null && (
          <div className="template-grid" aria-label={t("正在加载模板")}>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="skeleton template-skeleton" />
            ))}
          </div>
        )}

        {!templatesError && templates !== null && templates.length === 0 && (
          <div className="empty-state">
            <p>{t("暂无模板")}</p>
            {category && (
              <button type="button" className="button primary" onClick={() => setCategory(null)}>{t("查看全部模板")}</button>
            )}
          </div>
        )}

        {!templatesError && templates !== null && templates.length > 0 && (
          <div className="template-grid">
            {visibleTemplates?.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
