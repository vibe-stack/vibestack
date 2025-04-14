import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ThreadSelector = memo(
  ({
    threads,
    currentThreadId,
    onSelectThread,
    onCreateThread,
  }: {
    threads: { id: string; title: string }[];
    currentThreadId: string | null;
    onSelectThread: (threadId: string) => void;
    onCreateThread: () => void;
  }) => (
    <div className="flex items-center gap-2 mb-2">
      <Select
        value={currentThreadId || undefined}
        onValueChange={onSelectThread}
      >
        <SelectTrigger className="w-full h-8">
          <SelectValue placeholder="Select a thread" />
        </SelectTrigger>
        <SelectContent>
          {threads.map((thread) => (
            <SelectItem key={thread.id} value={thread.id}>
              {thread.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={onCreateThread}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
);

ThreadSelector.displayName = "ThreadSelector";

export default ThreadSelector; 