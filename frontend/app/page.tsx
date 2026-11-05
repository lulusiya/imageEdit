'use client';

import { useEffect, useMemo, useState } from 'react';
import { TemplateCard } from '../components/TemplateCard';
import { errorMessage, getCategories, getTemplates, isAbortError } from '../lib/api';
import type { CategorySummary, TemplateSummary } from '../lib/types';

export default function HomePage() {
  const [categories, setCategories] = useState<CategorySummary[] | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesReload, setCategoriesReload] = useState(0);

  const [category, setCategory] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templatesReload, setTemplatesReload] = useState(0);

  useEffect(() => {
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
  }, [categoriesReload]);

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

  const totalTemplates = useMemo(
    () => (categories ? categories.reduce((sum, item) => sum + item.count, 0) : null),
    [categories]
  );

  return (
    <div className="home-page">
      <section id="templates" className="templates-section" aria-labelledby="templates-title">
        <h1 id="templates-title">模板库</h1>
        <div className="category-bar" role="group" aria-label="按分类筛选模板">
          <button
            type="button"
            className={`category-pill ${category === null ? 'active' : ''}`}
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
          >
            全部
            {totalTemplates !== null && <span className="pill-count">{totalTemplates}</span>}
          </button>
          {(categories ?? []).map((item) => (
            <button
              key={item.name}
              type="button"
              className={`category-pill ${category === item.name ? 'active' : ''}`}
              aria-pressed={category === item.name}
              onClick={() => setCategory(item.name)}
            >
              {item.name}
              <span className="pill-count">{item.count}</span>
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
            >
              分类加载失败，点击重试
            </button>
          )}
        </div>

        {templatesError && (
          <div className="banner banner-error" role="alert">
            <span>{templatesError}</span>
            <button
              type="button"
              className="button ghost small"
              onClick={() => setTemplatesReload((value) => value + 1)}
            >
              重新加载
            </button>
          </div>
        )}

        {!templatesError && templates === null && (
          <div className="template-grid" aria-label="正在加载模板">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="skeleton template-skeleton" />
            ))}
          </div>
        )}

        {!templatesError && templates !== null && templates.length === 0 && (
          <div className="empty-state">
            <p>{category ? `“${category}”分类下暂时没有模板。` : '暂时没有可用模板。'}</p>
            {category && (
              <button type="button" className="button primary" onClick={() => setCategory(null)}>
                查看全部模板
              </button>
            )}
          </div>
        )}

        {!templatesError && templates !== null && templates.length > 0 && (
          <div className="template-grid">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
