import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "./MetricCard";
import { TeamOverview } from "./TeamOverview";
import { ProductivityChart } from "./ProductivityChart";
import { Users, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";

interface AdminDashboardProps {
  user: User | null;
  activeView: string;
}

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  todayMinutes: number;
  weeklyMinutes: number;
  avgScore: number;
  isActive: boolean;
}

export const AdminDashboard = ({ user, activeView }: AdminDashboardProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeNow, setActiveNow] = useState(0);
  const [avgProductivity, setAvgProductivity] = useState(0);
  const [lowPerformers, setLowPerformers] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Fetch all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch active sessions (no logout time)
      const { data: activeSessions, error: activeError } = await supabase
        .from("work_sessions")
        .select("user_id")
        .is("logout_time", null);

      if (activeError) throw activeError;

      // Fetch weekly productivity for all users
      const { data: weeklyProd, error: weeklyError } = await supabase
        .from("daily_productivity")
        .select("*")
        .gte("date", weekAgo);

      if (weeklyError) throw weeklyError;

      // Process team members
      const activeUserIds = new Set(activeSessions?.map((s) => s.user_id) || []);
      const userRoles = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      const members: TeamMember[] = (profiles || [])
        .map((profile) => {
          const userProd = weeklyProd?.filter((p) => p.user_id === profile.id) || [];
          const todayData = userProd.find((p) => p.date === today);
          const totalWeekMinutes = userProd.reduce((sum, p) => sum + (p.total_minutes || 0), 0);
          const scores = userProd.filter((p) => p.average_score !== null).map((p) => p.average_score as number);
          const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            todayMinutes: todayData?.total_minutes || 0,
            weeklyMinutes: totalWeekMinutes,
            avgScore,
            isActive: activeUserIds.has(profile.id),
          };
        });

      setTeamMembers(members);
      setTotalEmployees(members.length);
      setActiveNow(members.filter((m) => m.isActive).length);
      
      const allScores = members.filter((m) => m.avgScore > 0).map((m) => m.avgScore);
      setAvgProductivity(allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0);
      
      setLowPerformers(members.filter((m) => m.avgScore > 0 && m.avgScore < 50).length);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch team data.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (activeView === "team") {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">View and manage your team members</p>
        </div>
        <TeamOverview members={teamMembers} loading={loading} showFull />
      </div>
    );
  }

  if (activeView === "reports") {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Team Reports</h1>
          <p className="text-muted-foreground">Analyze team productivity trends</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Team Productivity Overview</h3>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>Select individual team members to view detailed reports</p>
          </div>
        </div>
      </div>
    );
  }
  if (activeView === "settings") {
    return <SettingsPanel user={user} role="admin" />;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your team's productivity and performance
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Employees"
          value={totalEmployees.toString()}
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Active Now"
          value={activeNow.toString()}
          icon={Clock}
          trend={activeNow > 0 ? "up" : undefined}
          subtitle="Currently working"
          loading={loading}
        />
        <MetricCard
          title="Team Avg Productivity"
          value={`${avgProductivity}%`}
          icon={TrendingUp}
          trend={avgProductivity >= 70 ? "up" : avgProductivity > 0 ? "down" : undefined}
          loading={loading}
        />
        <MetricCard
          title="Need Attention"
          value={lowPerformers.toString()}
          icon={AlertTriangle}
          trend={lowPerformers > 0 ? "down" : undefined}
          subtitle="Below 50% productivity"
          loading={loading}
          variant={lowPerformers > 0 ? "warning" : "default"}
        />
      </div>

      {/* Team Overview */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Team Overview</h3>
          <button 
            onClick={() => {}}
            className="text-sm text-primary hover:underline"
          >
            View All
          </button>
        </div>
        <TeamOverview members={teamMembers} loading={loading} />
      </div>
    </div>
  );
};
