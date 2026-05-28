import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AlertsPanelProps {
  userId?: string;
}

export const AlertsPanel = ({ userId }: AlertsPanelProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    }
  }, [userId]);

  const fetchAlerts = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("productivity_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await supabase
        .from("productivity_alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "low_productivity":
        return AlertTriangle;
      case "improvement":
        return TrendingUp;
      case "achievement":
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "low_productivity":
        return "text-warning bg-warning/10";
      case "improvement":
        return "text-success bg-success/10";
      case "achievement":
        return "text-primary bg-primary/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Bell className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No alerts yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          You'll see productivity insights here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon = getAlertIcon(alert.alert_type);
        const colorClass = getAlertColor(alert.alert_type);

        return (
          <button
            key={alert.id}
            onClick={() => markAsRead(alert.id)}
            className={cn(
              "w-full flex gap-3 p-3 rounded-lg text-left transition-all hover:bg-muted/50",
              !alert.is_read && "bg-primary/5 border border-primary/10"
            )}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", colorClass)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm", !alert.is_read && "font-medium")}>
                {alert.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(alert.created_at).toLocaleDateString()}
              </p>
            </div>
            {!alert.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            )}
          </button>
        );
      })}
    </div>
  );
};
