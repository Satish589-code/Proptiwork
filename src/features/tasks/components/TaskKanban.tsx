import { Task, TaskStatus } from "../types"
import StatusBadge from "./StatusBadge"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Paperclip } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Props {
  tasks: Task[]
  onStatusChange?: (id: string, status: TaskStatus) => void
  assigneeMap?: Record<string, string>
  isAdmin?: boolean
}

const STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "completed",
  "approved",
  "rejected",
]

export default function TaskKanban({
  tasks,
  onStatusChange,
  assigneeMap,
  isAdmin = false,
}: Props) {
  const grouped = STATUSES.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status)
      return acc
    },
    {
      todo: [],
      in_progress: [],
      completed: [],
      approved: [],
      rejected: [],
    }
  )

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {STATUSES.map((status) => (
        <div key={status} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold capitalize">
              {status.replace("_", " ")}
            </h3>
            <span className="text-xs text-muted-foreground">
              {grouped[status].length}
            </span>
          </div>

          <div className="space-y-3">
            {grouped[status].map((task) => {
              const isOverdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                task.status !== "completed"
              const assigneeLabel =
                assigneeMap?.[task.assigned_to] ||
                (task.assigned_to
                  ? `User ${task.assigned_to.slice(0, 6)}`
                  : "Unassigned")

              return (
                <Card
                  key={task.id}
                  className="glass shadow-sm border border-border/60 p-4 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{task.title}</div>
                      <StatusBadge status={task.status} />
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "destructive"
                          : task.priority === "medium"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span
                        className={
                          isOverdue ? "text-destructive font-semibold" : ""
                        }
                      >
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {isAdmin && (
                      <span className="text-muted-foreground">
                        {assigneeLabel}
                      </span>
                    )}
                  </div>

                  {task.task_attachments?.length ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Paperclip className="w-3 h-3" />
                      <span>
                        {task.task_attachments.length} attachment
                        {task.task_attachments.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : null}

                  {onStatusChange && !isAdmin && (
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        onStatusChange(task.id, value as TaskStatus)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in_progress">
                          In Progress
                        </SelectItem>
                        <SelectItem value="completed">
                          Completed
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
