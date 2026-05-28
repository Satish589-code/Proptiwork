import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "../types";

interface Props {
  status: TaskStatus;
}

export default function StatusBadge({ status }: Props) {
  const variants: Record<TaskStatus, string> = {
    todo: "secondary",
    in_progress: "default",
    completed: "outline",
    approved: "success",
    rejected: "destructive",
  };

  return (
    <Badge variant={variants[status] as any}>
      {status.replace("_", " ")}
    </Badge>
  );
}
