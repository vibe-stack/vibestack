import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

interface EmptyStateProps {
  onExpandChat?: () => void
}

export default function EmptyState({ onExpandChat }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="bg-zinc-800/50 p-8 rounded-xl max-w-md">
        <h3 className="text-xl font-medium mb-3">No Game Files Yet</h3>
        <p className="text-zinc-400 mb-6">
          Your game workspace is empty. Use the AI assistant to generate your first game file and start building.
        </p>
        <div className="flex justify-center">
          <Button 
            className="bg-emerald-700 hover:bg-emerald-600 gap-2"
            onClick={onExpandChat}
          >
            <MessageSquare className="h-4 w-4" />
            Start with AI Chat
          </Button>
        </div>
      </div>
    </div>
  )
} 