import { useLanguage } from '../lib/language';
import Link from 'next/link';
import type { TemplateSummary } from '../lib/types';

export function TemplateCard({ template }: { template: TemplateSummary }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/templates/${template.id}`}
      className="template-card"
      aria-label={t(template.title)}
    >
      <div className="template-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.coverUrl} alt={t(template.title)} loading="lazy" />
      </div>
      <div className="template-body">
        <h3>{t(template.title)}</h3>
      </div>
    </Link>
  );
}
