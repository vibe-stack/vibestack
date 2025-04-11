"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Bot, User, Sparkles, Code, ImageIcon } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function LLMAssistant({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI game development assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
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

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          <h3 className="font-medium">AI Assistant</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.role === "assistant" ? <Bot className="h-4 w-4 mr-1" /> : <User className="h-4 w-4 mr-1" />}
                  <span className="text-xs opacity-70">{message.role === "assistant" ? "Assistant" : "You"}</span>
                  <span className="text-xs opacity-70 ml-auto">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" className="h-8">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Generate
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Code className="h-3.5 w-3.5 mr-1" />
            Code
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            Image
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about game development..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
