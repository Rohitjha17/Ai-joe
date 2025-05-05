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
    <div className="flex flex-col min-h-screen w-full bg-white text-black overflow-x-hidden">
      {/* Header: Single logo, slim, left-aligned, tagline below */}
      <header className="w-full border-b border-gray-200 bg-black text-white px-4 py-4 flex flex-col items-start justify-center shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/dark.webp"
            alt="EOXS Logo"
            className="h-10 w-auto max-w-[140px] object-contain"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
          />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center bg-white px-1 py-2 w-full">
        <div className="flex flex-col md:flex-row w-full md:w-[90vw] max-w-[1600px] h-full md:h-[calc(100vh-70px)] items-center justify-center md:justify-between gap-2 md:gap-6 transition-all duration-300">
          {/* Avatar Area */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center h-[320px] md:h-[650px]">
            <div className="w-full h-full max-w-full flex items-center justify-center">
              <StreamingAvatarComponent ref={avatarRef} />
            </div>
          </div>
          {/* Chat Area */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center h-[400px] md:h-[80%]">
            <Card className="w-full h-full rounded-2xl border border-gray-200 bg-white text-black shadow-lg flex flex-col justify-between">
              <CardContent className="flex-1 flex flex-col justify-center p-6 md:p-10">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center w-full h-full">
                    <h3 className="text-3xl font-extrabold text-black mb-4">Welcome to Joe 2.0</h3>
                    <p className="text-lg text-gray-600 mb-2">
                      Experience the next generation of AI interaction.
                    </p>
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
              {/* Input always visible, sticky on mobile */}
              <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-10">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 w-full">
                  <Input
                    value={input}
                    onChange={(e) => {
                      handleUserInteraction()
                      handleInputChange(e)
                    }}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1 text-lg md:text-xl text-black border border-gray-200 placeholder-gray-400 bg-white rounded-full px-5 py-3 shadow-md"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="lg"
                    className="text-white bg-black hover:bg-gray-800 rounded-full px-5 py-3 shadow-md"
                  >
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      handleUserInteraction()
                      isListening ? stopListening() : startListening()
                    }}
                    className="text-black hover:bg-gray-100 rounded-full"
                    title={isListening ? "Stop voice typing" : "Start voice typing"}
                  >
                    <Mic className={`h-6 w-6 ${isListening ? 'animate-pulse text-green-500' : ''}`} />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
