"use client"

import type React from "react"
import { useState, useCallback } from "react"
import type { Message } from "ai"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastCompletedAssistantMessage, setLastCompletedAssistantMessage] = useState<Message | null>(null)
  const { toast } = useToast()

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>, metadata?: any) => {
      e.preventDefault()

      if (!input.trim()) return

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: input,
      }

      const assistantMessageId = uuidv4()
      const newMessages = [...messages, userMessage]

      // Update messages UI immediately
      setMessages([...newMessages, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      }])

      setInput("")
      setIsLoading(true)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
            vectorRatio: metadata?.vectorRatio,
            summaryLength: metadata?.summaryLength || "none",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || `Error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No reader available")

        let accumulatedText = ""
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            // Finalize the full assistant message for speaking
            setLastCompletedAssistantMessage({
              id: assistantMessageId,
              role: "assistant",
              content: accumulatedText,
            })
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk

          // Update UI with the streamed chunk
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: accumulatedText } : m
            )
          )
        }

      } catch (error: any) {
        console.error("Error sending message:", error)

        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))

        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
          },
        ])

        toast({
          title: "Error",
          description: error.message || "Failed to send message. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [input, messages, toast]
  )

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    lastCompletedAssistantMessage, // <-- Exposed for use in ChatPage.tsx
  }
}
