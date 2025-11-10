import { Badge } from "@/components/ui/badge";

export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <Badge 
      className={`bg-gradient-to-r from-pro-gold-dark to-pro-gold text-slate-950 border-pro-gold-light font-bold text-[10px] px-1.5 py-0 tracking-wide ${className}`}
      data-testid="badge-pro"
    >
      PRO
    </Badge>
  );
}

export function ProFeatureIndicator({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <ProBadge />
    </div>
  );
}
