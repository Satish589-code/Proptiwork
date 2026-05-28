import { useEffect, useMemo, useState } from "react"
import { User } from "@supabase/supabase-js"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ThemeMode = "system" | "light" | "dark"

interface SettingsPanelProps {
  user: User | null
  role: "admin" | "user"
}

const THEME_KEY = "proptiwork-theme"
const AUTO_START_KEY = "proptiwork-auto-start"
const NOTIFY_KEY = "proptiwork-notify"
const COMPACT_KEY = "proptiwork-compact"
const TASK_VIEW_KEY = "proptiwork-task-view"
const TASK_HIDE_COMPLETED_KEY = "proptiwork-task-hide-completed"
const TASK_DEFAULT_PRIORITY_KEY = "proptiwork-task-default-priority"

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
  const shouldUseDark =
    theme === "dark" || (theme === "system" && prefersDark)
  root.classList.toggle("dark", shouldUseDark)
}

export function SettingsPanel({ user, role }: SettingsPanelProps) {
  const [theme, setTheme] = useState<ThemeMode>("system")
  const [autoStart, setAutoStart] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [taskView, setTaskView] = useState<"table" | "kanban">("table")
  const [hideCompleted, setHideCompleted] = useState(false)
  const [defaultPriority, setDefaultPriority] = useState<
    "low" | "medium" | "high"
  >("medium")

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null
    const savedAutoStart = localStorage.getItem(AUTO_START_KEY)
    const savedNotify = localStorage.getItem(NOTIFY_KEY)
    const savedCompact = localStorage.getItem(COMPACT_KEY)
    const savedTaskView = localStorage.getItem(TASK_VIEW_KEY)
    const savedHideCompleted = localStorage.getItem(TASK_HIDE_COMPLETED_KEY)
    const savedDefaultPriority = localStorage.getItem(
      TASK_DEFAULT_PRIORITY_KEY
    )

    if (savedTheme) {
      setTheme(savedTheme)
    }
    if (savedAutoStart !== null) {
      setAutoStart(savedAutoStart === "true")
    }
    if (savedNotify !== null) {
      setNotifications(savedNotify === "true")
    }
    if (savedCompact !== null) {
      setCompactMode(savedCompact === "true")
    }
    if (savedTaskView === "table" || savedTaskView === "kanban") {
      setTaskView(savedTaskView)
    }
    if (savedHideCompleted !== null) {
      setHideCompleted(savedHideCompleted === "true")
    }
    if (
      savedDefaultPriority === "low" ||
      savedDefaultPriority === "medium" ||
      savedDefaultPriority === "high"
    ) {
      setDefaultPriority(savedDefaultPriority)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(AUTO_START_KEY, String(autoStart))
  }, [autoStart])

  useEffect(() => {
    localStorage.setItem(NOTIFY_KEY, String(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem(COMPACT_KEY, String(compactMode))
    document.documentElement.classList.toggle("compact-ui", compactMode)
  }, [compactMode])

  useEffect(() => {
    localStorage.setItem(TASK_VIEW_KEY, taskView)
  }, [taskView])

  useEffect(() => {
    localStorage.setItem(TASK_HIDE_COMPLETED_KEY, String(hideCompleted))
  }, [hideCompleted])

  useEffect(() => {
    localStorage.setItem(TASK_DEFAULT_PRIORITY_KEY, defaultPriority)
  }, [defaultPriority])

  const title = useMemo(
    () => (role === "admin" ? "Admin Settings" : "Settings"),
    [role]
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">
            Manage your preferences and workspace experience
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass shadow-sm border border-border/60 p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Account</h3>
            <p className="text-xs text-muted-foreground">
              Personal details and role access
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{role}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass shadow-sm border border-border/60 p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Appearance</h3>
            <p className="text-xs text-muted-foreground">
              Theme and layout options
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Theme</p>
              <Select value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Compact Layout</p>
                <p className="text-xs text-muted-foreground">
                  Tighten spacing in cards and lists
                </p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>
          </div>
        </Card>

        <Card className="glass shadow-sm border border-border/60 p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Automation</h3>
            <p className="text-xs text-muted-foreground">
              Session and notification preferences
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-start Session</p>
                <p className="text-xs text-muted-foreground">
                  Start tracking automatically on login
                </p>
              </div>
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Productivity Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Notify when productivity drops
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>
        </Card>

        <Card className="glass shadow-sm border border-border/60 p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Task Preferences</h3>
            <p className="text-xs text-muted-foreground">
              Default behavior for task management
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Default View</p>
              <Select
                value={taskView}
                onValueChange={(value) =>
                  setTaskView(value as "table" | "kanban")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="kanban">Kanban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Default Priority</p>
              <Select
                value={defaultPriority}
                onValueChange={(value) =>
                  setDefaultPriority(
                    value as "low" | "medium" | "high"
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Hide Completed</p>
                <p className="text-xs text-muted-foreground">
                  Filter out completed tasks by default
                </p>
              </div>
              <Switch
                checked={hideCompleted}
                onCheckedChange={setHideCompleted}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
