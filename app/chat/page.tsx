"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatMessage from "@/components/chat-message";
import StreamingAvatarComponent from "@/components/streaming-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Menu } from "lucide-react";

export default function ChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleStop,
    handleSubmit,
    isLoading,
    lastCompletedAssistantMessage
  } = useChat();

  const isMobile = useIsMobile();
  const avatarRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showConversation, setShowConversation] = useState(!isMobile);

  useEffect(() => {
    if (avatarRef.current) {
      avatarRef.current.initialize();
    }
  }, []);

  useEffect(() => {
    if (lastCompletedAssistantMessage && avatarRef.current) {
      avatarRef.current.speak(lastCompletedAssistantMessage.content);
    }
  }, [lastCompletedAssistantMessage]);

  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleConversation = () => {
    setShowConversation(!showConversation);
  };

  return (
    <main className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="w-full border-b border-gray-800 bg-black px-4 py-4 flex items-center justify-start shadow-sm">
        <img
          src="/dark.webp"
          alt="EOXS Logo"
          className="h-10 w-auto max-w-[140px] object-contain"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
        />
      </header>

      {/* Main Body */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Avatar Section */}
        <div
          className={`${
            isMobile && showConversation ? "h-1/2" : "h-full"
          } w-full md:w-3/4 flex flex-col items-center justify-center bg-black transition-all duration-300`}
        >
          <div className="w-full h-full max-w-[1000px]">
            <StreamingAvatarComponent ref={avatarRef} />
          </div>

          {/* Toggle Chat Button - Move to bottom */}
          {isMobile && (
            <div className="mt-auto p-2 w-full flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleConversation}
                className="w-full text-sm bg-gray-900 border-gray-700 text-white"
              >
                <Menu className="h-4 w-4 mr-2" />
                {showConversation ? "Hide Chat" : "Show Chat"}
              </Button>
            </div>
          )}
        </div>
                {/* Chat Section */}
                {(!isMobile || showConversation) && (
                  <div className="w-full md:w-1/4 h-full flex flex-col bg-[#0f0f0f]">
                    {/* Message history (only if showConversation is true) */}
                    {showConversation && (
                      <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-3 space-y-4"
                      >
                        {messages.length === 0 ? (
                          <div className="text-center text-gray-400 p-4">
                            <h3 className="text-2xl font-semibold mb-2">Welcome to Joe 2.0</h3>
                            <p className="text-sm text-gray-500">
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
                      </div>
                    )}

                    {/* Input always visible */}
                    <form
                      onSubmit={handleSubmit}
                      className="p-3 border-t border-gray-800 flex gap-2 bg-[#0f0f0f]"
                    >
                      <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 text-white bg-black border-gray-700 placeholder-gray-500"
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-white text-black"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          handleStop();
                          avatarRef.current?.cancel();
                        }}
                        disabled={!isLoading}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Stop
                      </Button>
                    </form>
                  </div>
                )}

      </div>
    </main>
  );
}
