"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, User, Bot, Loader2, Play, Square, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: string;
  actionTaken?: {
    type: string;
    description: string;
  };
}

interface DemoMessage {
  id: string;
  role: string;
  content: string;
  intent?: string;
  actionTaken?: string;
}

interface DemoSimulation {
  id: string;
  personaName: string;
  scenarioType: string;
  messages: DemoMessage[];
}

interface ChatWidgetProps {
  className?: string;
  defaultOpen?: boolean;
}

export default function ChatWidget({ className, defaultOpen = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoSimulation, setDemoSimulation] = useState<DemoSimulation | null>(null);
  const [demoMessageIndex, setDemoMessageIndex] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize session
  const initSession = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setSessionId(data.data.sessionId);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: data.data.welcomeMessage,
            timestamp: new Date(),
          },
        ]);
      } else {
        setError("Failed to start chat session");
      }
    } catch (err) {
      console.error("Failed to init session:", err);
      setError("Failed to connect to chat service");
    }
  }, []);

  // Initialize on first open
  useEffect(() => {
    if (isOpen && !sessionId && !isDemoMode) {
      initSession();
    }
  }, [isOpen, sessionId, initSession, isDemoMode]);

  // Fetch demo simulation
  const loadDemoSimulation = useCallback(async () => {
    try {
      const response = await fetch("/api/simulations/demo");
      const data = await response.json();

      if (data.success) {
        setDemoSimulation(data.data);
        setDemoMessageIndex(0);
        setMessages([]);
        return true;
      } else {
        setError("No demo simulations available. Run a simulation first.");
        return false;
      }
    } catch (err) {
      console.error("Failed to load demo:", err);
      setError("Failed to load demo simulation");
      return false;
    }
  }, []);

  // Toggle demo mode
  const toggleDemoMode = async () => {
    if (!isDemoMode) {
      // Entering demo mode
      const loaded = await loadDemoSimulation();
      if (loaded) {
        setIsDemoMode(true);
        setSessionId(null);
        setIsDemoPlaying(false);
      }
    } else {
      // Exiting demo mode
      setIsDemoMode(false);
      setDemoSimulation(null);
      setDemoMessageIndex(0);
      setMessages([]);
      setIsDemoPlaying(false);
    }
  };

  // Demo playback effect
  useEffect(() => {
    if (!isDemoMode || !isDemoPlaying || !demoSimulation) return;

    if (demoMessageIndex >= demoSimulation.messages.length) {
      setIsDemoPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      const demoMsg = demoSimulation.messages[demoMessageIndex];
      const newMessage: Message = {
        id: `demo-${demoMessageIndex}`,
        role: demoMsg.role === "USER" ? "user" : "assistant",
        content: demoMsg.content,
        timestamp: new Date(),
        intent: demoMsg.intent,
        actionTaken: demoMsg.actionTaken ? { type: demoMsg.actionTaken, description: `Action: ${demoMsg.actionTaken}` } : undefined,
      };

      setMessages((prev) => [...prev, newMessage]);
      setDemoMessageIndex((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isDemoMode, isDemoPlaying, demoSimulation, demoMessageIndex]);

  // Reset demo
  const resetDemo = () => {
    setDemoMessageIndex(0);
    setMessages([]);
    setIsDemoPlaying(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: data.data.message,
          timestamp: new Date(),
          intent: data.data.intent,
          actionTaken: data.data.actionTaken,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update session ID if it changed
        if (data.data.conversationId) {
          setSessionId(data.data.conversationId);
        }
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-carsa-primary to-carsa-secondary text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Carsa Support</h3>
                <p className="text-xs text-white/80">
                  {isDemoMode ? `Demo: ${demoSimulation?.personaName || "Loading..."}` : "AI-powered assistance"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Demo mode toggle */}
              <button
                onClick={toggleDemoMode}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full transition-colors",
                  isDemoMode
                    ? "bg-yellow-500 text-white"
                    : "bg-white/20 hover:bg-white/30"
                )}
                title={isDemoMode ? "Exit demo mode" : "Watch a demo"}
              >
                {isDemoMode ? "Exit Demo" : "Demo"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Demo Controls Banner */}
          {isDemoMode && demoSimulation && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-yellow-800">
                {demoSimulation.scenarioType} scenario
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetDemo}
                  className="p-1.5 text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDemoPlaying(!isDemoPlaying)}
                  className="p-1.5 text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
                  title={isDemoPlaying ? "Pause" : "Play"}
                >
                  {isDemoPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-xs text-yellow-600">
                  {demoMessageIndex}/{demoSimulation.messages.length}
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-carsa-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-carsa-primary text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Action indicator */}
                  {message.actionTaken && (
                    <div className="mt-2 pt-2 border-t border-gray-200/50">
                      <p className="text-xs text-carsa-success flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-carsa-success" />
                        {message.actionTaken.description}
                      </p>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-carsa-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 inline-block">
                  {error}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            {isDemoMode ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">
                  {isDemoPlaying
                    ? "Playing demo conversation..."
                    : demoMessageIndex >= (demoSimulation?.messages.length || 0)
                      ? "Demo complete! Click reset to replay."
                      : "Press play to start the demo"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-carsa-primary focus:ring-2 focus:ring-carsa-primary/20 text-sm text-gray-900 placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      input.trim() && !isLoading
                        ? "bg-carsa-primary text-white hover:bg-carsa-secondary"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-2">
                  Powered by AI • <button className="underline hover:text-gray-600">Speak to a human</button>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105",
          isOpen
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-gradient-to-r from-carsa-primary to-carsa-secondary hover:shadow-xl"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
}
