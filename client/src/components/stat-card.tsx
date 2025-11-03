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
      className="hover-elevate border shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-md bg-muted/50">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trend.isPositive ? "text-success" : "text-destructive"}`}>
            {trend.isPositive ? "↗ +" : "↘ "}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
