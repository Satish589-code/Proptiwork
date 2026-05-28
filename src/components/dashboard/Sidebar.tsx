import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  LayoutDashboard,
  FileBarChart,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  CheckSquare, // 🔥 Added icon
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = "dashboard" | "tasks" | "productivity" | "reports" | "team" | "settings"; // 🔥 added "tasks"

interface SidebarProps {
  user: User | null;
  role: "admin" | "user";
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const Sidebar = ({
  user,
  role,
  activeView,
  onViewChange,
}: SidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  const menuItems = [
    { id: "dashboard" as ViewType, label: "Dashboard", icon: LayoutDashboard },

    // 🔥 TASKS MENU (New)
    { id: "tasks" as ViewType, label: "Tasks", icon: CheckSquare },

    ...(role === "admin"
      ? [
          {
            id: "productivity" as ViewType,
            label: "Productivity",
            icon: Activity,
          },
        ]
      : []),

    { id: "reports" as ViewType, label: "Reports", icon: FileBarChart },

    ...(role === "admin"
      ? [{ id: "team" as ViewType, label: "Team", icon: Users }]
      : []),

    { id: "settings" as ViewType, label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">ProptiWork</span>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {role} Account
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  activeView === item.id
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left font-medium">
                  {item.label}
                </span>
                {activeView === item.id && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-accent/30 mb-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
            {user?.email?.[0].toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
