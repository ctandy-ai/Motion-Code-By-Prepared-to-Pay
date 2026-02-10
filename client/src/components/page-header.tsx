import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions, badge, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap" data-testid="page-header">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6 text-brand-400 shrink-0" />}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-slate-100" data-testid="text-page-title">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-slate-400 mt-1" data-testid="text-page-description">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap" data-testid="page-header-actions">
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
