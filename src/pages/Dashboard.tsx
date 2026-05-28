import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Loader2 } from "lucide-react";

// ðŸ”¥ Import Tasks Pages
import AdminTasks from "@/features/tasks/pages/AdminTasks";
import UserTasks from "@/features/tasks/pages/UserTasks";
import ProductivityDashboard from "@/modules/productivity/ProductivityDashboard";

type AppRole = "admin" | "user";

// ðŸ”¥ Added "tasks"
type ViewType =
  | "dashboard"
  | "tasks"
  | "productivity"
  | "reports"
  | "team"
  | "settings";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>("user");
  const [loading, setLoading] = useState(true);

  // ðŸ”¥ Updated ViewType
  const [activeView, setActiveView] = useState<ViewType>("dashboard");

  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
      } else if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
      } else if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (role !== "admin" && activeView === "productivity") {
      setActiveView("dashboard");
    }
  }, [role, activeView]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      setRole((data?.role as AppRole) || "user");
    } catch (error) {
      console.error("Error fetching role:", error);
      setRole("user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        user={user}
        role={role}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="flex-1 overflow-auto">
        {role === "admin" ? (
          activeView === "productivity" ? (
            <ProductivityDashboard role={role} userId={null} />
          ) : activeView === "tasks" ? (
            <AdminTasks />
          ) : (
            <AdminDashboard user={user} activeView={activeView} />
          )
        ) : activeView === "tasks" ? (
          <UserTasks />
        ) : (
          <EmployeeDashboard user={user} activeView={activeView} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
