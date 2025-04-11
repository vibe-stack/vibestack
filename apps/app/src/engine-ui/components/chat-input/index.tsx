"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Bot, ChevronDown, ChevronUp, Send, Sparkles, Code, ImageIcon } from "lucide-react"

interface ChatInputProps {
  expanded: boolean
  onToggleExpand: () => void
}

export default function ChatInput({ expanded, onToggleExpand }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "How can I help with your game development today?" },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input }])
    const userQuery = input
    setInput("")

    // Simulate assistant response
    setTimeout(() => {
      const assistantResponses = [
        "I can help you implement that game mechanic. Let's start by creating a new script for it.",
        "Here's how you could structure your game objects for better performance.",
        "To fix that bug, check your collision detection code. Make sure you're using the correct layers.",
        "For mobile optimization, consider reducing draw calls and using sprite atlases.",
        "I can generate a simple enemy AI for you. Would you like it to follow the player or patrol an area?",
      ]

      const randomResponse = assistantResponses[Math.floor(Math.random() * assistantResponses.length)]
      setMessages((prev) => [...prev, { role: "assistant", content: randomResponse }])
    }, 1000)
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Bot className="h-4 w-4 mr-2 opacity-70" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={onToggleExpand}>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {expanded && (
        <ScrollArea className="flex-1 p-3 h-[calc(100%-80px)]">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    message.role === "assistant" ? "bg-zinc-800/50" : "bg-emerald-700/80 text-zinc-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      <div className="p-3">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" className="h-8 rounded-lg bg-zinc-800/30 border-0 hover:bg-zinc-800/70">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 opacity-80" />
            Generate
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg bg-zinc-800/30 border-0 hover:bg-zinc-800/70">
            <Code className="h-3.5 w-3.5 mr-1.5 opacity-80" />
            Code
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg bg-zinc-800/30 border-0 hover:bg-zinc-800/70">
            <ImageIcon className="h-3.5 w-3.5 mr-1.5 opacity-80" />
            Image
          </Button>
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me anything about game development..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1 min-h-[60px] max-h-[120px] bg-zinc-800/30 border-0 rounded-lg resize-none"
          />
          <Button
            className="self-end rounded-lg bg-emerald-700 hover:bg-emerald-600 h-10 px-4"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
