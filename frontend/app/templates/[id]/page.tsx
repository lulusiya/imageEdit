'use client';

import { useLanguage } from '../../../lib/language';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TemplateTasks } from '../../../components/TemplateTasks';
import { TemplateWorkspace } from '../../../components/TemplateWorkspace';
import { errorMessage, getTemplate, isAbortError } from '../../../lib/api';
import { useIdentity } from '../../../lib/identity';
import type { TemplateDetail } from '../../../lib/types';

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage();
  const templateId = params.id;
  const { user } = useIdentity();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setTemplate(null);
    setDetailError(null);
    getTemplate(templateId, controller.signal)
      .then((detail) => setTemplate(detail))
      .catch((error) => {
        if (!isAbortError(error)) {
          setDetailError(errorMessage(error, '模板加载失败'));
        }
      });
    return () => controller.abort();
  }, [templateId, reload]);

  return (
    <div className="detail-page">
      {detailError && (
        <>
          <Link href="/templates" className="back-link">{t("← 返回模板库")}</Link>
          <div className="banner banner-error" role="alert">
            <span>{t(detailError)}</span>
            <button
              type="button"
              className="button ghost small"
              onClick={() => setReload((value) => value + 1)}
            >{t("重新加载")}</button>
          </div>
        </>
      )}

      {!detailError && template === null && (
        <div className="detail-layout detail-loading" aria-label={t("正在加载模板详情")}>
          <div className="skeleton detail-preview-skeleton" />
          <div className="skeleton detail-workspace-skeleton" />
        </div>
      )}

      {template && (
        <div className="detail-layout">
          <section className="maker-panel">
            <header className="maker-heading">
              <Link href="/templates" className="maker-back" aria-label={t("返回模板库")}>‹</Link>
              <h1>{t(template.title)}</h1>
            </header>
            <figure className="preview-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.coverUrl}
                alt=""
                aria-hidden="true"
                className="preview-blur"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.coverUrl}
                alt={t(template.title)}
                className="preview-art"
              />
              <span className="preview-mask" aria-hidden="true" />
            </figure>
            <TemplateWorkspace
              key={`${template.id}:${user?.id ?? 'anonymous'}`}
              detail={template}
            />
          </section>
          <TemplateTasks templateId={template.id} />
        </div>
      )}
    </div>
  );
}
