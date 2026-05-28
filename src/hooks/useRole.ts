import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRole() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchRole = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      setRole(data?.role || "");
    };

    fetchRole();
  }, []);

  return role;
}
