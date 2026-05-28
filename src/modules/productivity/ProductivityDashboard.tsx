import { useEffect, useMemo, useState } from "react"
import { useProductivity } from "./hooks/useProductivity"
import {
  addRule,
  deleteRule,
  fetchActiveSessionsCount,
  fetchMonthlyProductivity,
  fetchProfilesCount,
  fetchRules,
  fetchTeamDailyProductivity,
  fetchTopDomains,
} from "./services/productivityService"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { ProductivityChart } from "@/components/dashboard/ProductivityChart"
import ScoreRing from "./components/ScoreRing"

interface TopSite {
  domain: string
  seconds: number
}

interface Rule {
  id: string
  domain: string
  impact_score: number
}

interface ChartPoint {
  date: string
  total_minutes: number
  total_sessions: number
  average_score: number | null
}

type Range = "today" | "yesterday" | "custom" | "monthly" | "yearly" | "rules"

interface ProductivityDashboardProps {
  role?: "admin" | "user"
  userId?: string | null
}

export default function ProductivityDashboard({
  role,
  userId,
}: ProductivityDashboardProps) {
  const isAdmin = role === "admin"

  const todayStr = new Date().toLocaleDateString("en-CA")
  const yesterdayStr = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-CA")

  const [range, setRange] = useState<Range>("today")
  const [customDate, setCustomDate] = useState(todayStr)
  const effectiveDate =
    range === "yesterday"
      ? yesterdayStr
      : range === "custom"
        ? customDate
        : todayStr

  const { data, loading } = useProductivity(effectiveDate)

  const filteredData = useMemo(
    () =>
      userId ? data.filter((row) => row.user_id === userId) : data,
    [data, userId]
  )

  const [topSitesMap, setTopSitesMap] = useState<
    Record<string, TopSite[]>
  >({})
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [yearlyData, setYearlyData] = useState<
    { year: string; productivity_percent: number }[]
  >([])
  const [teamWeeklyData, setTeamWeeklyData] = useState<ChartPoint[]>([])
  const [teamWeeklyLoading, setTeamWeeklyLoading] = useState(false)
  const [rules, setRules] = useState<Rule[]>([])
  const [newRuleDomain, setNewRuleDomain] = useState("")
  const [newRuleScore, setNewRuleScore] = useState(20)
  const [activeSessions, setActiveSessions] = useState(0)
  const [totalEmployees, setTotalEmployees] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadTopSites() {
      const map: Record<string, TopSite[]> = {}

      for (const row of filteredData) {
        const sites = await fetchTopDomains(row.user_id, effectiveDate)
        map[row.user_id] = sites
      }

      if (!cancelled) {
        setTopSitesMap(map)
      }
    }

    if (filteredData.length > 0) {
      loadTopSites()
    } else {
      setTopSitesMap({})
    }

    return () => {
      cancelled = true
    }
  }, [filteredData, effectiveDate])

  useEffect(() => {
    let mounted = true

    const buildYearly = (rows: any[]) => {
      const map: Record<string, { total: number; count: number }> = {}

      for (const row of rows) {
        if (!row.month) continue
        const year = String(row.month).slice(0, 4)
        map[year] = map[year] || { total: 0, count: 0 }
        map[year].total += row.productivity_percent || 0
        map[year].count += 1
      }

      return Object.entries(map)
        .map(([year, data]) => ({
          year,
          productivity_percent: data.count
            ? Math.round(data.total / data.count)
            : 0,
        }))
        .sort((a, b) => b.year.localeCompare(a.year))
    }

    async function loadMonthly() {
      const rows = await fetchMonthlyProductivity(userId ?? undefined)

      if (mounted) {
        setMonthlyData(rows)
        setYearlyData(buildYearly(rows))
      }
    }

    loadMonthly()

    return () => {
      mounted = false
    }
  }, [userId])

  useEffect(() => {
    if (!isAdmin) return

    let mounted = true

    const buildTeamWeekly = (rows: any[]) => {
      const map: Record<
        string,
        {
          total_minutes: number
          total_sessions: number
          score_sum: number
          score_count: number
        }
      > = {}

      for (const row of rows) {
        const key = row.date
        if (!map[key]) {
          map[key] = {
            total_minutes: 0,
            total_sessions: 0,
            score_sum: 0,
            score_count: 0,
          }
        }

        map[key].total_minutes += row.total_minutes || 0
        map[key].total_sessions += row.total_sessions || 0
        if (row.average_score !== null && row.average_score !== undefined) {
          map[key].score_sum += row.average_score
          map[key].score_count += 1
        }
      }

      return Object.entries(map)
        .map(([date, values]) => ({
          date,
          total_minutes: values.total_minutes,
          total_sessions: values.total_sessions,
          average_score: values.score_count
            ? Math.round(values.score_sum / values.score_count)
            : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    async function loadTeamWeekly() {
      setTeamWeeklyLoading(true)
      try {
        const end = new Date()
        const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        const startDate = start.toISOString().slice(0, 10)
        const endDate = end.toISOString().slice(0, 10)

        const rows = await fetchTeamDailyProductivity(startDate, endDate)
        if (mounted) {
          setTeamWeeklyData(buildTeamWeekly(rows))
        }
      } finally {
        if (mounted) {
          setTeamWeeklyLoading(false)
        }
      }
    }

    loadTeamWeekly()

    return () => {
      mounted = false
    }
  }, [isAdmin])

  useEffect(() => {
    let mounted = true

    async function loadRules() {
      const rows = await fetchRules()
      if (mounted) {
        setRules(rows as Rule[])
      }
    }

    if (isAdmin) {
      loadRules()
    }

    return () => {
      mounted = false
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return

    let mounted = true

    async function loadCounts() {
      const [activeCount, totalCount] = await Promise.all([
        fetchActiveSessionsCount(),
        fetchProfilesCount(),
      ])

      if (mounted) {
        setActiveSessions(activeCount)
        setTotalEmployees(totalCount)
      }
    }

    loadCounts()

    return () => {
      mounted = false
    }
  }, [isAdmin])

  const handleAddRule = async () => {
    const domain = newRuleDomain.trim()
    if (!domain) return

    await addRule(domain, newRuleScore)
    const rows = await fetchRules()
    setRules(rows as Rule[])
    setNewRuleDomain("")
  }

  const handleDeleteRule = async (id: string) => {
    await deleteRule(id)
    const rows = await fetchRules()
    setRules(rows as Rule[])
  }

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.round(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours <= 0) return `${minutes}m`
    return `${hours}h ${minutes}m`
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 70) return "High"
    if (score >= 40) return "Medium"
    return "Low"
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 70) return "text-success bg-success/10"
    if (score >= 40) return "text-warning bg-warning/10"
    return "text-destructive bg-destructive/10"
  }

  const teamAvgScore = useMemo(() => {
    if (filteredData.length === 0) return 0
    const total = filteredData.reduce(
      (sum, row) => sum + (row.productivity_percent ?? 0),
      0
    )
    return Math.round(total / filteredData.length)
  }, [filteredData])

  const totalSeconds = useMemo(
    () =>
      filteredData.reduce(
        (sum, row) => sum + (row.total_seconds ?? 0),
        0
      ),
    [filteredData]
  )

  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10
  const dayLabel =
    range === "custom"
      ? customDate
      : range === "yesterday"
        ? "yesterday"
        : "today"

  const dailyContent = (
    <>
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass shadow-md border border-border/60 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Avg Productivity
            </div>
            <div className="text-3xl font-semibold text-primary mt-3">
              {teamAvgScore}%
            </div>
            <div className="text-xs text-muted-foreground">
              team average
            </div>
          </Card>
          <Card className="glass shadow-md border border-border/60 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Active Sessions
            </div>
            <div className="text-3xl font-semibold text-accent mt-3">
              {activeSessions}/{totalEmployees || activeSessions}
            </div>
            <div className="text-xs text-muted-foreground">
              employees online
            </div>
          </Card>
          <Card className="glass shadow-md border border-border/60 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Total Hours
            </div>
            <div className="text-3xl font-semibold text-warning mt-3">
              {totalHours}h
            </div>
            <div className="text-xs text-muted-foreground">
              tracked {dayLabel}
            </div>
          </Card>
          <Card className="glass shadow-md border border-border/60 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Priority Rules
            </div>
            <div className="text-3xl font-semibold text-primary mt-3">
              {rules.length}
            </div>
            <div className="text-xs text-muted-foreground">
              monitored apps/sites
            </div>
          </Card>
        </div>
      )}

      {isAdmin && (
        <Card className="glass shadow-md border border-border/60 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold">
                Team Activity & Productivity
              </div>
              <div className="text-xs text-muted-foreground">
                Last 7 days (all users)
              </div>
            </div>
          </div>
          <ProductivityChart
            data={teamWeeklyData}
            loading={teamWeeklyLoading}
          />
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin w-6 h-6" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No productivity data for selected date.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filteredData.map((item) => {
            const profile = item.profiles
            const username =
              profile?.full_name ||
              profile?.email?.split("@")[0] ||
              (item.user_id ? `User ${item.user_id.slice(0, 6)}` : "Unknown")
            const initials =
              username === "Unknown"
                ? "UN"
                : username
                    .split(" ")
                    .map((part: string) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

            const score = Math.round(item.productivity_percent ?? 0)
            const productiveMinutes = Math.round(
              (item.productive_seconds ?? 0) / 60
            )
            const trackedSeconds = item.total_seconds ?? 0

            const topSites = topSitesMap[item.user_id] ?? []
            const maxSeconds =
              topSites.length > 0
                ? Math.max(...topSites.map((site) => site.seconds))
                : 1

            return (
              <Card
                key={item.user_id}
                className="glass shadow-sm border border-border/60 p-5 space-y-4 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {username}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(trackedSeconds)} tracked
                      </div>
                    </div>
                  </div>
                  <div className="scale-75 origin-top-right">
                    <ScoreRing score={score} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {productiveMinutes} min productive
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(
                      score
                    )}`}
                  >
                    {getPerformanceLabel(score)}
                  </span>
                </div>

                <div className="space-y-2">
                  {topSites.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No activity
                    </div>
                  ) : (
                    topSites.map((site) => (
                      <div key={site.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate">
                            {site.domain}
                          </span>
                          <span>
                            {Math.round(site.seconds / 60)}m
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                            style={{
                              width: `${Math.round(
                                (site.seconds / maxSeconds) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-6 p-6 bg-gradient-to-b from-background via-background to-primary/5">
      <Tabs value={range} onValueChange={(value) => setRange(value as Range)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">
              Productivity Command Center
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time employee activity & productivity intelligence
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Date
                </span>
                <input
                  className="border rounded-md px-2 py-1 text-sm bg-background/80"
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value)
                    setRange("custom")
                  }}
                />
              </div>
            )}

            <TabsList className="bg-card/80 backdrop-blur border border-border/60 shadow-sm p-1 rounded-xl">
              <TabsTrigger
                value="today"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Today
              </TabsTrigger>
              <TabsTrigger
                value="yesterday"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Yesterday
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Date
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Yearly
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger
                  value="rules"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Rules
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        <TabsContent value="today">
          {dailyContent}
        </TabsContent>

        <TabsContent value="yesterday">
          <div className="text-sm text-muted-foreground mb-4">
            Showing yesterday ({yesterdayStr})
          </div>
          {dailyContent}
        </TabsContent>

        <TabsContent value="custom">
          <div className="text-sm text-muted-foreground mb-4">
            Showing selected date ({customDate})
          </div>
          {dailyContent}
        </TabsContent>

        <TabsContent value="monthly">
          <Card className="glass shadow-sm border border-border/60 p-5">
            {monthlyData.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No monthly data.
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {monthlyData.map((row, index) => (
                  <li key={index}>
                    {row.month} -{" "}
                    {Math.round(row.productivity_percent ?? 0)}%
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="yearly">
          <Card className="glass shadow-sm border border-border/60 p-5">
            {yearlyData.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No yearly data.
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {yearlyData.map((row, index) => (
                  <li key={index}>
                    {row.year} -{" "}
                    {Math.round(row.productivity_percent ?? 0)}%
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="rules">
          <Card className="glass shadow-sm border border-border/60 p-5 space-y-4">
              <div className="font-semibold">Priority Rules</div>

              <div className="flex flex-wrap gap-2">
                <input
                  className="border rounded-md px-2 py-1 flex-1 min-w-[200px]"
                  placeholder="example.com or app name"
                  value={newRuleDomain}
                  onChange={(e) => setNewRuleDomain(e.target.value)}
                />
                <input
                  className="border rounded-md px-2 py-1 w-24"
                  type="number"
                  min={-100}
                  max={100}
                  value={newRuleScore}
                  onChange={(e) => setNewRuleScore(Number(e.target.value))}
                />
                <button
                  className="rounded-md px-3 py-1 bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition"
                  onClick={handleAddRule}
                >
                  Add Rule
                </button>
              </div>

              <div className="text-xs text-muted-foreground">
                Use negative scores for distracting sites and positive
                scores for productive work.
              </div>

              {rules.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No rules yet.
                </div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {rules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {rule.domain} ({rule.impact_score})
                      </span>
                      <button
                        className="text-xs underline"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
