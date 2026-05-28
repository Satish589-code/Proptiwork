import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "./MetricCard";
import { SessionTracker } from "./SessionTracker";
import { ProductivityChart } from "./ProductivityChart";
import { AlertsPanel } from "./AlertsPanel";
import { Clock, TrendingUp, Target, Calendar } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";

interface EmployeeDashboardProps {
  user: User | null;
  activeView: string;
}

interface DailyProductivity {
  date: string;
  total_minutes: number;
  total_sessions: number;
  average_score: number | null;
}

export const EmployeeDashboard = ({ user, activeView }: EmployeeDashboardProps) => {
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [avgProductivity, setAvgProductivity] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [weeklyData, setWeeklyData] = useState<DailyProductivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProductivityData();
    }
  }, [user]);

  const fetchProductivityData = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Fetch weekly productivity data
      const { data: weeklyProd, error: weeklyError } = await supabase
        .from("daily_productivity")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", weekAgo)
        .order("date", { ascending: true });

      if (weeklyError) throw weeklyError;

      if (weeklyProd) {
        setWeeklyData(weeklyProd);
        
        const todayData = weeklyProd.find((d) => d.date === today);
        setTodayMinutes(todayData?.total_minutes || 0);
        
        const totalWeekMinutes = weeklyProd.reduce((sum, d) => sum + (d.total_minutes || 0), 0);
        setWeeklyMinutes(totalWeekMinutes);
        
        const totalWeekSessions = weeklyProd.reduce((sum, d) => sum + (d.total_sessions || 0), 0);
        setTotalSessions(totalWeekSessions);
        
        const scores = weeklyProd.filter((d) => d.average_score !== null).map((d) => d.average_score as number);
        if (scores.length > 0) {
          setAvgProductivity(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch productivity data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (activeView === "reports") {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Productivity Reports</h1>
          <p className="text-muted-foreground">View your detailed productivity analytics</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <ProductivityChart data={weeklyData} loading={loading} />
        </div>
      </div>
    );
  }

  if (activeView === "settings") {
    return <SettingsPanel user={user} role="user" />;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.user_metadata?.full_name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Track your work sessions and monitor your productivity
        </p>
      </div>

      {/* Session Tracker */}
      <div className="mb-8">
        <SessionTracker user={user} onSessionUpdate={fetchProductivityData} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Today's Work Time"
          value={formatTime(todayMinutes)}
          icon={Clock}
          trend={todayMinutes > 0 ? "up" : undefined}
          loading={loading}
        />
        <MetricCard
          title="Weekly Total"
          value={formatTime(weeklyMinutes)}
          icon={Calendar}
          subtitle="Last 7 days"
          loading={loading}
        />
        <MetricCard
          title="Avg Productivity"
          value={`${avgProductivity}%`}
          icon={TrendingUp}
          trend={avgProductivity >= 70 ? "up" : avgProductivity > 0 ? "down" : undefined}
          loading={loading}
        />
        <MetricCard
          title="Total Sessions"
          value={totalSessions.toString()}
          icon={Target}
          subtitle="This week"
          loading={loading}
        />
      </div>

      {/* Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Productivity</h3>
          <ProductivityChart data={weeklyData} loading={loading} />
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Alerts & Notifications</h3>
          <AlertsPanel userId={user?.id} />
        </div>
      </div>
    </div>
  );
};
