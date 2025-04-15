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
    <div className="flex items-center gap-1 mb-1">
      <Select
        value={currentThreadId || undefined}
        onValueChange={onSelectThread}
      >
        <SelectTrigger className="w-full h-6 text-xs px-1 rounded-md bg-muted/30 border border-border">
          <SelectValue placeholder="Select a thread" className="text-xs" />
        </SelectTrigger>
        <SelectContent className="text-xs bg-background/60 backdrop-blur-md border border-border">
          {threads.map((thread) => (
            <SelectItem key={thread.id} value={thread.id} className="text-xs px-2 py-1">
              {thread.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="default"
        size="icon"
        className="h-6 w-6 p-0 flex items-center justify-center rounded-md border border-border bg-muted/30"
        onClick={onCreateThread}
        tabIndex={-1}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
);

ThreadSelector.displayName = "ThreadSelector";

export default ThreadSelector; 