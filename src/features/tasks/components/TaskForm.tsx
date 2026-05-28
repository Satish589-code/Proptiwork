import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

interface Props {
  onCreated: () => void
  currentUserId: string
}

const DEFAULT_PRIORITY_KEY = "proptiwork-task-default-priority"

export default function TaskForm({ onCreated, currentUserId }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [defaultPriority, setDefaultPriority] = useState<
    "low" | "medium" | "high"
  >("medium")
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>()
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email")

      setUsers(data || [])
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(DEFAULT_PRIORITY_KEY)
    if (stored === "low" || stored === "medium" || stored === "high") {
      setPriority(stored)
      setDefaultPriority(stored)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assignedTo) {
      console.error("User not selected")
      return
    }

    try {
      const { data: insertedTask, error } = await supabase
        .from("tasks")
        .insert({
          title,
          description,
          assigned_to: assignedTo,
          created_by: currentUserId,
          priority,
          estimated_hours: estimatedHours,
          due_date: dueDate || null,
          status: "todo",
        })
        .select()
        .single()

      if (error || !insertedTask) {
        console.error("Task creation failed:", error)
        return
      }

      const taskId = insertedTask.id

      if (files.length > 0) {
        for (const file of files) {
          const path = `task-${taskId}/${Date.now()}-${file.name}`

          const { error: uploadError } = await supabase.storage
            .from("task-attachments")
            .upload(path, file)

          if (uploadError) {
            console.error("Upload failed:", uploadError)
            continue
          }

          const { data } = supabase.storage
            .from("task-attachments")
            .getPublicUrl(path)

          await supabase.from("task_attachments").insert({
            task_id: taskId,
            file_name: file.name,
            file_url: data.publicUrl,
          })
        }
      }

      setTitle("")
      setDescription("")
      setAssignedTo("")
      setPriority(defaultPriority)
      setEstimatedHours(undefined)
      setDueDate("")
      setFiles([])

      onCreated()
    } catch (err) {
      console.error("Unexpected error:", err)
    }
  }

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || ""
    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return "[img]"
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "[vid]"
    if (["mp3", "wav", "ogg", "flac"].includes(ext)) return "[aud]"
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "[zip]"
    if (ext === "pdf") return "[pdf]"
    if (["md", "txt", "csv", "log"].includes(ext)) return "[txt]"
    if (["js", "ts", "jsx", "tsx", "py", "rb", "go", "java", "c", "cpp", "rs"].includes(ext)) return "[code]"
    return "[file]"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Task description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium">Assign To</label>
          <Select onValueChange={setAssignedTo}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select
            value={priority}
            onValueChange={(value) =>
              setPriority(value as "low" | "medium" | "high")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Estimated Hours</label>
          <Input
            type="number"
            placeholder="Hours"
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Due Date</label>
          <Input
            type="date"
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Attachments</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer.files) {
              setFiles((prev) => [
                ...prev,
                ...Array.from(e.dataTransfer.files),
              ])
            }
          }}
          className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/40 transition cursor-pointer"
        >
          <input
            type="file"
            multiple
            className="hidden"
            id="multiUpload"
            onChange={(e) => {
              if (e.target.files) {
                setFiles((prev) => [
                  ...prev,
                  ...Array.from(e.target.files),
                ])
              }
            }}
          />
          <label htmlFor="multiUpload" className="cursor-pointer">
            Drag and drop files here or click to upload
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted rounded-md px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold" aria-hidden>
                    {getFileIcon(file.name)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="text-destructive text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="px-6">
          Create Task
        </Button>
      </div>
    </form>
  )
}
