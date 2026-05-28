import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  todayMinutes: number;
  weeklyMinutes: number;
  avgScore: number;
  isActive: boolean;
}

interface TeamOverviewProps {
  members: TeamMember[];
  loading?: boolean;
  showFull?: boolean;
}

export const TeamOverview = ({ members, loading, showFull }: TeamOverviewProps) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success bg-success/10";
    if (score >= 50) return "text-warning bg-warning/10";
    return "text-destructive bg-destructive/10";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(showFull ? 6 : 4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No team members yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Team members will appear here once they sign up
        </p>
      </div>
    );
  }

  const displayMembers = showFull ? members : members.slice(0, 4);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Employee
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Today
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              This Week
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
              Productivity
            </th>
          </tr>
        </thead>
        <tbody>
          {displayMembers.map((member) => (
            <tr
              key={member.id}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {(member.full_name?.[0] || member.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {member.full_name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <Badge
                  variant={member.isActive ? "default" : "secondary"}
                  className={cn(
                    "font-normal",
                    member.isActive && "bg-success/10 text-success border-success/20"
                  )}
                >
                  {member.isActive ? "● Active" : "Offline"}
                </Badge>
              </td>
              <td className="py-4 px-4 text-foreground">
                {formatTime(member.todayMinutes)}
              </td>
              <td className="py-4 px-4 text-foreground">
                {formatTime(member.weeklyMinutes)}
              </td>
              <td className="py-4 px-4">
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium",
                    getScoreColor(member.avgScore)
                  )}
                >
                  {member.avgScore > 0 ? `${member.avgScore}%` : "N/A"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
