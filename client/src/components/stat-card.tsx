import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card 
      data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="magnetic-hover overflow-hidden relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-xp/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-xp/10 border border-xp/20">
          <Icon className="h-4 w-4 text-xp" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-display font-bold text-foreground group-hover:text-xp transition-colors">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 font-semibold ${trend.isPositive ? "text-success" : "text-destructive"}`}>
            {trend.isPositive ? "↗ +" : "↘ "}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
