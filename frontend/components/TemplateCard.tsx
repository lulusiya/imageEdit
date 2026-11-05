import Link from 'next/link';
import type { TemplateSummary } from '../lib/types';

export function TemplateCard({ template }: { template: TemplateSummary }) {
  return (
    <Link
      href={`/templates/${template.id}`}
      className="template-card"
      aria-label={`${template.title}，需要 ${template.requiredImageCount} 张素材`}
    >
      <div className="template-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.coverUrl} alt={`${template.title} 模板封面`} loading="lazy" />
        <span className="template-badge">{template.requiredImageCount} 张素材</span>
      </div>
      <div className="template-body">
        <p className="template-category">{template.category}</p>
        <h3>{template.title}</h3>
        <span className="template-cta">开始制作 →</span>
      </div>
    </Link>
  );
}
