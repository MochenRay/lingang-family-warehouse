import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div data-page-header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div data-page-eyebrow className="text-xs font-semibold tracking-[0.12em] text-[#4E86DF]">{eyebrow}</div>
        <h2 data-page-title className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-neutral-08)]">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
