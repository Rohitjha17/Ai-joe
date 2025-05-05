"use client";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType } from "@heygen/streaming-avatar";
import { generateChatResponse } from "@/app/actions/chat-actions";

const StreamingAvatarComponent = forwardRef((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);

  const fetchAccessToken = async (): Promise<string> => {
    const response = await fetch("/api/heygen-token");
    const { token } = await response.json();
    return token;
  };

  const initialize = async () => {
    const token = await fetchAccessToken();
    const avatarInstance = new StreamingAvatar({ token });
    setAvatar(avatarInstance);

    avatarInstance.on(StreamingEvents.STREAM_READY, (event) => {
      if (event.detail && videoRef.current) {
        videoRef.current.srcObject = event.detail;
        videoRef.current.play();
      }
    });

    avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    });

    await avatarInstance.createStartAvatar({
      quality: AvatarQuality.Medium,
      avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID!,
      language: "English",
    });
  };

  const speak = async (text: string) => {
    if (avatar && text) {
      await avatar.speak({ text, taskType: TaskType.REPEAT });
    }
  };

  useImperativeHandle(ref, () => ({
    initialize,
    speak,
  }));

  return (
    <div className="space-y-4 w-full px-2">
      <div className="relative w-full rounded-xl border shadow-md overflow-hidden bg-gradient-to-b from-gray-100 to-gray-300 flex items-center justify-center"
        style={{ minHeight: '180px', height: '40vw', maxHeight: 400 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-300 bg-transparent"
          style={{ zIndex: 2, background: 'transparent' }}
        />
        {/* Placeholder overlay if video is not loaded */}
        {!videoRef.current || !videoRef.current.srcObject ? (
          <div className="flex flex-col items-center justify-center w-full h-full z-1">
            <div className="rounded-full bg-gray-300 flex items-center justify-center" style={{ width: 72, height: 72 }}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 7v-6m0 0l-7-4m7 4l7-4" />
              </svg>
            </div>
            <span className="mt-2 text-gray-500 text-xs">Avatar will appear here</span>
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default StreamingAvatarComponent;
