import { useEffect, useState } from "react"
import { useProductivity } from "../hooks/useProductivity"
import { fetchTopDomains } from "../services/productivityService"
import ScoreRing from "./ScoreRing"

export default function ProductivityOverview() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading } = useProductivity(today)

  const [topSitesMap, setTopSitesMap] = useState<Record<string, any[]>>({})

  useEffect(() => {
    async function loadTopSites() {
      const map: Record<string, any[]> = {}

      for (const row of data) {
        const sites = await fetchTopDomains(row.user_id, today)
        map[row.user_id] = sites
      }

      setTopSitesMap(map)
    }

    if (data.length > 0) {
      loadTopSites()
    }
  }, [data, today])

  if (loading) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Admin Productivity Overview</h2>

      {data.map((row) => {
        const score = Math.round(row.productivity_percent ?? 0)
        const totalMinutes = Math.round((row.total_seconds ?? 0) / 60)
        const productiveMinutes = Math.round(
          (row.productive_seconds ?? 0) / 60
        )

        const username =
          row.profiles?.email?.split("@")[0] ?? "Unknown User"

        const topSites = topSitesMap[row.user_id] ?? []

        return (
          <div
            key={row.user_id}
            className="p-6 rounded-xl border bg-card space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{username}</h3>
              <ScoreRing score={score} />
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <p>Total: {totalMinutes} min</p>
              <p>Productive: {productiveMinutes} min</p>
              <p>Score: {score}%</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">
                Top 5 Sites
              </h4>

              {topSites.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No activity
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {topSites.map((site, index) => (
                    <li key={index}>
                      {site.domain} —{" "}
                      {Math.round(site.seconds / 60)} min
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}