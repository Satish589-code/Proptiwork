export interface DailyProductivity {
  [x: string]: any
  user_id: string
  activity_date: string
  total_seconds: number
  productive_seconds: number
  productivity_percent: number
}