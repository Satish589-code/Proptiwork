import { supabase } from "@/integrations/supabase/client";

export const getRules = async () => {
  const { data } = await supabase
    .from("productivity_rules")
    .select("*")
    .order("impact_score", { ascending: false });

  return data;
};

export const addRule = async (domain: string, score: number) => {
  await supabase.from("productivity_rules").insert({
    domain,
    impact_score: score,
  });
};

export const deleteRule = async (id: string) => {
  await supabase.from("productivity_rules").delete().eq("id", id);
};