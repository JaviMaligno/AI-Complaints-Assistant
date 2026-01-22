"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, User, Play, Pause, SkipForward, RotateCcw, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Message {
  id: string;
  role: string;
  content: string;
  personaIntent?: string;
  emotionLevel?: number;
  intent?: string;
  confidence?: number;
  responseLatency?: number;
  actionTaken?: string;
}

interface ConversationReplayProps {
  messages: Message[];
  personaName: string;
  autoPlay?: boolean;
  showMetadata?: boolean;
}

export default function ConversationReplay({
  messages,
  personaName,
  autoPlay = false,
  showMetadata = true,
}: ConversationReplayProps) {
  const [visibleCount, setVisibleCount] = useState(autoPlay ? 0 : messages.length);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying || visibleCount >= messages.length) {
      if (visibleCount >= messages.length) {
        setIsPlaying(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((v) => v + 1);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, visibleCount, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  const visibleMessages = messages.slice(0, visibleCount);

  const reset = () => {
    setVisibleCount(0);
    setIsPlaying(false);
  };

  const skipToEnd = () => {
    setVisibleCount(messages.length);
    setIsPlaying(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-carsa-primary to-carsa-secondary text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Conversation Replay</h3>
            <p className="text-sm text-white/80">{personaName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={skipToEnd}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Skip to end"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-white/20 rounded-full h-1.5">
          <div
            className="bg-white rounded-full h-1.5 transition-all duration-300"
            style={{ width: `${(visibleCount / messages.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-white/60 mt-1">
          {visibleCount} / {messages.length} messages
        </p>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto bg-gray-50">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquareIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Press play to start the conversation</p>
          </div>
        ) : (
          visibleMessages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-fadeIn",
                message.role === "USER" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "ASSISTANT" && (
                <div className="w-8 h-8 rounded-full bg-carsa-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "USER"
                    ? "bg-carsa-primary text-white rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Metadata */}
                {showMetadata && (
                  <div
                    className={cn(
                      "mt-2 pt-2 border-t text-xs flex flex-wrap gap-x-3 gap-y-1",
                      message.role === "USER"
                        ? "border-white/20 text-white/70"
                        : "border-gray-100 text-gray-500"
                    )}
                  >
                    {message.role === "USER" && message.personaIntent && (
                      <span>Intent: {message.personaIntent}</span>
                    )}
                    {message.role === "USER" && message.emotionLevel != null && (
                      <span>
                        Emotion: {Math.round(message.emotionLevel * 100)}%
                      </span>
                    )}
                    {message.role === "ASSISTANT" && message.intent && (
                      <span>Classified: {message.intent}</span>
                    )}
                    {message.role === "ASSISTANT" && message.responseLatency && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {message.responseLatency}ms
                      </span>
                    )}
                    {message.role === "ASSISTANT" && message.actionTaken && (
                      <span className="flex items-center gap-1 text-carsa-success">
                        <Zap className="w-3 h-3" />
                        {message.actionTaken}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {message.role === "USER" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isPlaying && visibleCount < messages.length && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-carsa-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
