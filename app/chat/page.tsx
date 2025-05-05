"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useChat } from "@/hooks/use-chat"
import ChatMessage from "@/components/chat-message"
import {
  Send,
  Loader2,
  Mic,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import StreamingAvatarComponent from "@/components/streaming-avatar"

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const [testingOpenAI, setTestingOpenAI] = useState(false)
  const { toast } = useToast()
  const avatarRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isListening, setIsListening] = useState(false)
  const [isAvatarLoading, setIsAvatarLoading] = useState(true)
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize avatar when component mounts and user has interacted
  useEffect(() => {
    const initAvatar = async () => {
      if (avatarRef.current && hasUserInteracted) {
        setIsAvatarLoading(true)
        try {
          await avatarRef.current.initialize()
        } catch (error) {
          console.error("Failed to initialize avatar:", error)
          toast({
            title: "Avatar Error",
            description: "Failed to initialize the avatar. Please refresh the page.",
            variant: "destructive",
          })
        } finally {
          setIsAvatarLoading(false)
        }
      }
    }
    initAvatar()
  }, [toast, hasUserInteracted])

  // Automatically speak the last assistant message when it changes
  useEffect(() => {
    const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop()
    if (avatarRef.current && lastAssistantMessage?.content && !isAvatarLoading && hasUserInteracted) {
      const speakMessage = async () => {
        setIsAvatarSpeaking(true)
        try {
          await avatarRef.current.speak(lastAssistantMessage.content)
        } catch (error) {
          console.error("Failed to speak message:", error)
        } finally {
          setIsAvatarSpeaking(false)
        }
      }
      speakMessage()
    }
  }, [messages, isAvatarLoading, hasUserInteracted])

  const handleUserInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true)
    }
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    handleUserInteraction()
    e.preventDefault()
    const metadata = {  }
    await handleSubmit(e, metadata)
  }

  // Speech-to-text logic
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.')
      return
    }
    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('')
      handleInputChange({ target: { value: transcript } } as any)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }
  const stopListening = () => setIsListening(false)

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-black overflow-hidden">
      {/* Navigation Bar */}
      <nav className="w-full flex items-center justify-between px-4 py-2 sm:px-8 sm:py-4 border-b border-gray-300 bg-black text-white">
        <div className="flex items-center">
          <img
            src="/dark.webp"
            alt="Logo"
            className="h-8 w-auto sm:h-10 max-w-[120px] object-contain mr-2"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
          />
        </div>
      </nav>
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Panel - Avatar Only */}
        <div className="w-full md:w-3/4 flex items-center justify-center bg-white h-48 sm:h-64 md:h-full min-h-[180px] max-h-[400px] md:max-h-none relative">
          {!hasUserInteracted ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-center px-4 text-black">Click anywhere to start the avatar</p>
                <Button
                  onClick={handleUserInteraction}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Start Avatar
                </Button>
              </div>
            </div>
          ) : isAvatarLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-black" />
                <span className="text-sm text-black">Loading avatar...</span>
              </div>
            </div>
          ) : null}
          {isAvatarSpeaking && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <span className="animate-pulse">●</span>
              Speaking
            </div>
          )}
          <StreamingAvatarComponent ref={avatarRef} />
        </div>
        {/* Right Panel - Chat UI */}
        <div className="w-full md:w-1/2 flex flex-col p-2 sm:p-4 overflow-hidden bg-white text-black h-full">
          <Card className="flex-1 overflow-hidden flex flex-col border border-gray-200 bg-white text-black">
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-4">
                  <div className="max-w-sm space-y-2">
                    <h3 className="text-sm font-medium text-black">Welcome to Joe 2.0</h3>
                    <p className="text-xs text-gray-600">
                      Experience the next generation of AI interaction. I'm here to assist you with intelligent conversations, powered by advanced language models and real-time avatar technology.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>
            <div className="p-2 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                <Input
                  value={input}
                  onChange={(e) => {
                    handleUserInteraction()
                    handleInputChange(e)
                  }}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 text-xs text-black border border-gray-200 placeholder-gray-400 bg-white"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="text-white bg-black hover:bg-gray-800"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    handleUserInteraction()
                    isListening ? stopListening() : startListening()
                  }}
                  className="text-black hover:bg-gray-100"
                  title={isListening ? "Stop voice typing" : "Start voice typing"}
                >
                  <Mic className={`h-5 w-5 ${isListening ? 'animate-pulse text-green-500' : ''}`} />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
