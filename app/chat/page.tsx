"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@/hooks/use-chat"
import { useIsMobile } from "@/hooks/use-mobile"
import ChatMessage from "@/components/chat-message"
import StreamingAvatarComponent from "@/components/streaming-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Menu } from "lucide-react"

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, lastCompletedAssistantMessage } = useChat()

  const isMobile = useIsMobile()
  const avatarRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [showConversation, setShowConversation] = useState(!isMobile)

  // Initialize avatar
  useEffect(() => {
    if (avatarRef.current) {
      avatarRef.current.initialize()
    }
  }, [])

  // Speak when new assistant message is completed
  useEffect(() => {
    if (lastCompletedAssistantMessage && avatarRef.current) {
      avatarRef.current.speak(lastCompletedAssistantMessage.content)
    }
  }, [lastCompletedAssistantMessage])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const toggleConversation = () => {
    setShowConversation(!showConversation)
  }

  return (
    <main className="flex flex-col h-screen bg-background">
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
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Avatar Section */}
        <div className={`${isMobile ? "h-1/2" : "md:w-1/2"} flex items-center justify-center p-4`}>
          <StreamingAvatarComponent ref={avatarRef} />
        </div>

        {/* Chat Section */}
        <div className={`${isMobile ? "h-1/2" : "md:w-1/2"} flex flex-col p-4`}>
          {/* Mobile Toggle Button */}
          {isMobile && (
            <Button variant="outline" size="sm" className="mb-2 self-end" onClick={toggleConversation}>
              <Menu className="h-4 w-4 mr-2" />
              {showConversation ? "Hide Chat" : "Show Chat"}
            </Button>
          )}

          {/* Messages Container */}
          {(showConversation || !isMobile) && (
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 border rounded-lg p-4"
              style={{
                maxHeight: isMobile ? "calc(100% - 80px)" : "calc(100% - 70px)",
                height: isMobile ? "calc(100% - 80px)" : "calc(100% - 70px)",
              }}
            >
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">

                    <h3 className="text-3xl font-extrabold text-white mb-4">Welcome to Joe 2.0</h3>
                    <p className="text-lg text-gray-600 mb-2">
                      Experience the next generation of AI interaction.
                    </p>


                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
