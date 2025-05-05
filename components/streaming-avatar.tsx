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
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-xl border shadow-md w-full h-[400px] bg-black"
      />
    </div>
  );
});

export default StreamingAvatarComponent;
