import { supabase } from "@/integrations/supabase/client"

/* ===============================
   DAILY PRODUCTIVITY (ADMIN VIEW)
================================= */
export async function fetchDailyProductivity(date: string) {
  const { data, error } = await supabase
    .from("daily_productivity_percentage")
    .select("*")
    .eq("activity_date", date)

  if (error) {
    console.error("Supabase error:", error)
    throw error
  }

  return data ?? []
}

/* ===============================
   TOP DOMAINS PER USER
================================= */
export async function fetchTopDomains(userId: string, date: string) {
  if (!userId || !date) return []

  const start = new Date(`${date}T00:00:00`)
  const end = new Date(`${date}T23:59:59.999`)
  const startIso = start.toISOString()
  const endIso = end.toISOString()

  const { data, error } = await supabase
    .from("activity_logs")
    .select("domain, duration_seconds")
    .eq("user_id", userId)
    .gte("start_time", startIso)
    .lte("start_time", endIso)

  if (error) {
    console.error("fetchTopDomains error:", error)
    throw error
  }

  if (!data || data.length === 0) return []

  const domainMap: Record<string, number> = {}

  for (const row of data) {
    domainMap[row.domain] =
      (domainMap[row.domain] || 0) + row.duration_seconds
  }

  return Object.entries(domainMap)
    .map(([domain, seconds]) => ({ domain, seconds }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 5)
}

/* ===============================
   TEAM DAILY PRODUCTIVITY
================================= */
export async function fetchTeamDailyProductivity(
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from("daily_productivity")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })

  if (error) {
    console.error("fetchTeamDailyProductivity error:", error)
    throw error
  }

  return data ?? []
}

/* ===============================
   PROFILES BY IDS
================================= */
export async function fetchProfilesByIds(userIds: string[]) {
  if (!userIds.length) return []

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds)

  if (error) {
    console.error("fetchProfilesByIds error:", error)
    throw error
  }

  return data ?? []
}

/* ===============================
   TEAM COUNTS
================================= */
export async function fetchActiveSessionsCount() {
  const { count, error } = await supabase
    .from("work_sessions")
    .select("id", { count: "exact", head: true })
    .is("logout_time", null)

  if (error) {
    console.error("fetchActiveSessionsCount error:", error)
    throw error
  }

  return count ?? 0
}

export async function fetchProfilesCount() {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("fetchProfilesCount error:", error)
    throw error
  }

  return count ?? 0
}

/* ===============================
   MONTHLY PRODUCTIVITY
================================= */
export async function fetchMonthlyProductivity(userId?: string) {
  let query = supabase
    .from("monthly_productivity")
    .select("*")
    .order("month", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query

  if (error) {
    console.error("fetchMonthlyProductivity error:", error)
    throw error
  }

  return data ?? []
}

/* ===============================
   PRODUCTIVITY RULES
================================= */
export async function fetchRules() {
  const { data, error } = await supabase
    .from("productivity_rules")
    .select("*")
    .order("impact_score", { ascending: false })

  if (error) {
    console.error("fetchRules error:", error)
    throw error
  }

  return data ?? []
}

export async function addRule(domain: string, score: number) {
  const { error } = await supabase.from("productivity_rules").insert({
    domain,
    impact_score: score,
  })

  if (error) {
    console.error("addRule error:", error)
    throw error
  }
}

export async function deleteRule(id: string) {
  const { error } = await supabase
    .from("productivity_rules")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("deleteRule error:", error)
    throw error
  }
}
