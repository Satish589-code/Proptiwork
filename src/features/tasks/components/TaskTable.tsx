import { Task } from "../types"
import StatusBadge from "./StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Paperclip } from "lucide-react"

interface Props {
  tasks: Task[]
  onStatusChange?: (id: string, status: string) => void
  isAdmin?: boolean
  selectable?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string, checked: boolean) => void
  onToggleSelectAll?: (checked: boolean) => void
  assigneeMap?: Record<string, string>
}

export default function TaskTable({
  tasks,
  onStatusChange,
  isAdmin = false,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  assigneeMap,
}: Props) {
  if (!tasks.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No tasks available.
      </div>
    )
  }

  const allSelected =
    selectable &&
    selectedIds &&
    tasks.length > 0 &&
    tasks.every((task) => selectedIds.has(task.id))
  const someSelected =
    selectable &&
    selectedIds &&
    tasks.some((task) => selectedIds.has(task.id))
  const headerChecked = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 border-b">
          <tr>
            {selectable && (
              <th className="text-left px-4 py-3 font-semibold w-10">
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={(checked) =>
                    onToggleSelectAll?.(checked === true)
                  }
                />
              </th>
            )}
            <th className="text-left px-6 py-3 font-semibold">Title</th>
            {isAdmin && (
              <th className="text-left px-6 py-3 font-semibold">
                Assignee
              </th>
            )}
            <th className="text-left px-6 py-3 font-semibold">Priority</th>
            <th className="text-left px-6 py-3 font-semibold">Status</th>
            <th className="text-left px-6 py-3 font-semibold">Due</th>
            {!isAdmin && (
              <th className="text-left px-6 py-3 font-semibold">Update</th>
            )}
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => {
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
              <tr
                key={task.id}
                className="border-b last:border-0 hover:bg-muted/40 transition-colors"
              >
                {selectable && (
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedIds?.has(task.id) || false}
                      onCheckedChange={(checked) =>
                        onToggleSelect?.(task.id, checked === true)
                      }
                    />
                  </td>
                )}
                {/* TITLE */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{task.title}</span>

                    {/* Attachment Badge */}
                    {task.task_attachments?.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Paperclip className="w-3 h-3" />
                        <span>
                          {task.task_attachments.length} attachment
                          {task.task_attachments.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {isAdmin && (
                  <td className="px-6 py-4 text-muted-foreground">
                    {assigneeLabel}
                  </td>
                )}

                {/* PRIORITY */}
                <td className="px-6 py-4">
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
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <StatusBadge status={task.status} />
                </td>

                {/* DUE DATE */}
                <td
                  className={`px-6 py-4 ${
                    isOverdue
                      ? "text-destructive font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : "-"}
                </td>

                {/* UPDATE STATUS */}
                {!isAdmin && (
                  <td className="px-6 py-4">
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        onStatusChange?.(task.id, value)
                      }
                    >
                      <SelectTrigger className="w-[150px]">
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
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
