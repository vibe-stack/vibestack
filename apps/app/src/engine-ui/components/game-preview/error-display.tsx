import { Button } from "@/components/ui/button"

interface ErrorDisplayProps {
  error: string
  type: 'bundle' | 'runtime'
  setBundleError: (err: string | null) => void
  setGameError: (err: string | null) => void
  resetGame: () => void
}

export default function ErrorDisplay({ error, type, setBundleError, setGameError, resetGame }: ErrorDisplayProps) {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-10">
      <div className={`${type === 'bundle' ? 'bg-red-950/50 border-red-700' : 'bg-orange-950/50 border-orange-700'} border p-6 rounded-lg max-w-lg w-full`}>
        <h3 className={`${type === 'bundle' ? 'text-red-400' : 'text-orange-400'} font-medium mb-2`}>
          {type === 'bundle' ? 'Bundle Error' : 'Runtime Error'}
        </h3>
        <div className="bg-black/50 p-3 rounded text-red-300 font-mono text-sm mb-3 overflow-auto max-h-40">
          {error}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={() => type === 'bundle' ? setBundleError(null) : setGameError(null)}
          >
            Dismiss
          </Button>
          {type === 'runtime' && (
            <Button 
              variant="default"
              className="flex-1" 
              onClick={resetGame}
            >
              Restart Game
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 