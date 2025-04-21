import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import LoadingDots from '../llm-assistant/LoadingDots'
import { Sparkles } from 'lucide-react'

export default function AssetStudioPromptBar({ onSubmit, isLoading }: { onSubmit?: (prompt: string) => void, isLoading?: boolean }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const prompt = value.trim()
    if (!prompt) return
    setValue('')
    onSubmit?.(prompt)
    inputRef.current?.blur()
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-10 left-0 w-full z-50 flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-xl px-4">
        <div className="relative flex items-center bg-zinc-950/80 border border-green-900/15 shadow-inner rounded-xl px-3 py-2 gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="What do you want to generate?"
            disabled={isLoading}
            className="bg-transparent border-none text-green-200 placeholder:text-green-900/60 focus:ring-0 focus-visible:ring-0 focus-visible:border-green-400 px-2 py-2 text-sm rounded-lg shadow-none"
            style={{ boxShadow: 'none' }}
          />
          {isLoading && (
            <div className="flex items-center justify-center h-8 w-8 mr-1">
              <LoadingDots />
            </div>
          )}
          <Button
            type="submit"
            size="icon"
            variant="default"
            disabled={isLoading || !value.trim()}
            className={`ml-1 h-8 w-8 rounded-full bg-green-500 hover:bg-green-400 active:bg-green-600 border-none shadow-md transition-colors flex items-center justify-center ${
              (isLoading || !value.trim()) ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
            aria-label="Send prompt"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </form>
  )
}

export type { AssetStudioPromptBar } 