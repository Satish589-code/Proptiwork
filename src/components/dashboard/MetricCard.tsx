import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  subtitle?: string;
  loading?: boolean;
  variant?: "default" | "warning" | "success";
}

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  loading,
  variant = "default",
}: MetricCardProps) => {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20",
        "animate-scale-in"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            variant === "warning" && "bg-warning/10",
            variant === "success" && "bg-success/10",
            variant === "default" && "bg-primary/10"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              variant === "warning" && "text-warning",
              variant === "success" && "text-success",
              variant === "default" && "text-primary"
            )}
          />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium mb-1",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive"
            )}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
};
