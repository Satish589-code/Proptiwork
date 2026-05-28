import { useEffect, useState } from "react"
import {
  fetchDailyProductivity,
  fetchProfilesByIds,
} from "../services/productivityService"

export function useProductivity(date: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)

        const result = await fetchDailyProductivity(date)
        const userIds = Array.from(
          new Set(
            result
              .map((row) => row.user_id)
              .filter((id: string | null) => Boolean(id))
          )
        )
        const profiles = await fetchProfilesByIds(userIds)
        const profileMap = new Map(
          profiles.map((profile) => [profile.id, profile])
        )
        const hydrated = result.map((row) => ({
          ...row,
          profiles: profileMap.get(row.user_id) || null,
        }))

        if (mounted) {
          setData(hydrated)
        }
      } catch (err) {
        console.error("useProductivity error:", err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [date])

  return { data, loading }
}
