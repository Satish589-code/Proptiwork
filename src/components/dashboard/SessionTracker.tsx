import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionTrackerProps {
  user: User | null;
  onSessionUpdate: () => void;
}

interface ActiveSession {
  id: string;
  login_time: string;
}

export const SessionTracker = ({ user, onSessionUpdate }: SessionTrackerProps) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkActiveSession();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession) {
      interval = setInterval(() => {
        const loginTime = new Date(activeSession.login_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - loginTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const checkActiveSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("work_sessions")
        .select("id, login_time")
        .eq("user_id", user.id)
        .is("logout_time", null)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setActiveSession(data || null);
    } catch (error) {
      console.error("Error checking session:", error);
    }
  };

  const startSession = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("work_sessions")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setActiveSession({ id: data.id, login_time: data.login_time });
      toast({
        title: "Session started",
        description: "Your work session has begun. Stay productive!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start session.",
      });
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!user || !activeSession) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("work_sessions")
        .update({ logout_time: new Date().toISOString() })
        .eq("id", activeSession.id);

      if (error) throw error;

      // Update daily productivity
      await updateDailyProductivity();

      setActiveSession(null);
      setElapsedTime(0);
      toast({
        title: "Session ended",
        description: `Great work! You worked for ${formatTime(elapsedTime)}.`,
      });
      onSessionUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDailyProductivity = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const minutes = Math.round(elapsedTime / 60);
    const score = calculateProductivityScore(minutes);

    try {
      // Check if record exists for today
      const { data: existing } = await supabase
        .from("daily_productivity")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (existing) {
        const newTotalMinutes = (existing.total_minutes || 0) + minutes;
        const newTotalSessions = (existing.total_sessions || 0) + 1;
        const newAvgScore = existing.average_score
          ? Math.round((existing.average_score + score) / 2)
          : score;

        await supabase
          .from("daily_productivity")
          .update({
            total_minutes: newTotalMinutes,
            total_sessions: newTotalSessions,
            average_score: newAvgScore,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("daily_productivity").insert({
          user_id: user.id,
          date: today,
          total_minutes: minutes,
          total_sessions: 1,
          average_score: score,
        });
      }
    } catch (error) {
      console.error("Error updating daily productivity:", error);
    }
  };

  const calculateProductivityScore = (minutes: number): number => {
    // Simple scoring: more time = better score, capped at 100
    // 8 hours (480 min) = 100%, less time scales proportionally
    const targetMinutes = 480;
    const score = Math.min(100, Math.round((minutes / targetMinutes) * 100));
    return Math.max(0, score);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all duration-300",
        activeSession
          ? "bg-success/5 border-success/30"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
              activeSession
                ? "gradient-success shadow-lg"
                : "bg-muted"
            )}
          >
            <Clock
              className={cn(
                "w-7 h-7",
                activeSession ? "text-success-foreground animate-pulse-subtle" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {activeSession ? "Session Active" : "Start Working"}
            </h3>
            {activeSession ? (
              <p className="text-2xl font-bold text-success">
                {formatTime(elapsedTime)}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Click start to begin tracking your work session
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {activeSession ? (
            <Button
              onClick={endSession}
              disabled={loading}
              variant="destructive"
              size="lg"
              className="px-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  End Session
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={startSession}
              disabled={loading}
              size="lg"
              className="px-6 gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {activeSession && (
        <div className="mt-4 pt-4 border-t border-success/20">
          <p className="text-sm text-muted-foreground">
            Session started at{" "}
            <span className="font-medium text-foreground">
              {new Date(activeSession.login_time).toLocaleTimeString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
