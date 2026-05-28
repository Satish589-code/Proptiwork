import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import TaskTable from "../components/TaskTable"
import TaskKanban from "../components/TaskKanban"
import { useTasks } from "../hooks/useTasks"
import { updateTasksStatusBulk } from "../services/taskService"
import { TaskStatus } from "../types"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { LayoutGrid, List, CheckCircle2 } from "lucide-react"

const TASK_VIEW_KEY = "proptiwork-task-view"
const TASK_HIDE_COMPLETED_KEY = "proptiwork-task-hide-completed"

export default function UserTasks() {
  const [userId, setUserId] = useState("")
  const [view, setView] = useState<"table" | "kanban">("table")
  const [hideCompleted, setHideCompleted] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [dueFilter, setDueFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>("in_progress")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || "")
    })
  }, [])

  useEffect(() => {
    const storedView = localStorage.getItem(TASK_VIEW_KEY)
    const storedHide = localStorage.getItem(TASK_HIDE_COMPLETED_KEY)
    if (storedView === "table" || storedView === "kanban") {
      setView(storedView)
    }
    if (storedHide !== null) {
      setHideCompleted(storedHide === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(TASK_VIEW_KEY, view)
  }, [view])

  useEffect(() => {
    localStorage.setItem(TASK_HIDE_COMPLETED_KEY, String(hideCompleted))
  }, [hideCompleted])

  const { tasks, loading, error, changeStatus, statusCounts, fetchTasks } =
    useTasks({ userId })

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(tasks.map((task) => task.id))
      const next = new Set<string>()
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id)
      })
      return next
    })
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return tasks.filter((task) => {
      if (hideCompleted && task.status === "completed") return false
      if (
        query &&
        !(
          task.title.toLowerCase().includes(query) ||
          (task.description || "").toLowerCase().includes(query)
        )
      ) {
        return false
      }
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false
      }
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false
      }

      if (dueFilter !== "all") {
        const dueDate = task.due_date ? new Date(task.due_date) : null
        if (dueFilter === "overdue") {
          return (
            dueDate !== null &&
            dueDate < today &&
            task.status !== "completed"
          )
        }
        if (dueFilter === "today") {
          return (
            dueDate !== null && dueDate >= today && dueDate <= endOfDay
          )
        }
        if (dueFilter === "week") {
          return (
            dueDate !== null && dueDate >= today && dueDate <= endOfWeek
          )
        }
        if (dueFilter === "no_due") {
          return dueDate === null
        }
      }

      return true
    })
  }, [tasks, search, statusFilter, priorityFilter, dueFilter, hideCompleted])

  const selectedCount = selectedIds.size

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(filteredTasks.map((task) => task.id)))
  }

  const handleToggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleBulkStatus = async () => {
    if (!selectedCount) return
    await updateTasksStatusBulk(Array.from(selectedIds), bulkStatus)
    setSelectedIds(new Set())
    await fetchTasks()
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8">{error}</div>

  return (
    <div className="space-y-6 p-8 bg-gradient-to-b from-background via-background to-primary/5">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">
          Track and update your assigned tasks.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {["todo", "in_progress", "completed", "approved", "rejected"].map(
          (status) => (
            <Card
              key={status}
              className="glass shadow-sm border border-border/60"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {status.replace("_", " ")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {statusCounts[status] || 0}
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <Card className="glass shadow-sm border border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold">
              Assigned Tasks
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={view === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("table")}
              >
                <List />
                Table
              </Button>
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("kanban")}
              >
                <LayoutGrid />
                Kanban
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4">
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select value={dueFilter} onValueChange={setDueFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Due" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Due Dates</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="week">Due This Week</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="no_due">No Due Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                Hide completed
              </div>
              <Switch
                checked={hideCompleted}
                onCheckedChange={setHideCompleted}
              />
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
              <div className="text-sm font-medium">
                {selectedCount} selected
              </div>
              <Select
                value={bulkStatus}
                onValueChange={(value) =>
                  setBulkStatus(value as TaskStatus)
                }
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleBulkStatus}>
                <CheckCircle2 />
                Update
              </Button>
            </div>
          )}

          {view === "table" ? (
            <TaskTable
              tasks={filteredTasks}
              onStatusChange={changeStatus}
              selectable
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleSelectAll}
            />
          ) : (
            <TaskKanban tasks={filteredTasks} onStatusChange={changeStatus} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
