"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
}

interface Conversation {
  id: string;
  patientId: string;
  providerId: string;
  messages?: Message[];
}

export function ConversationView() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/conversations").then((r) => r.data.data ?? []),
  });

  // Fetch messages for active conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["messages", activeId],
    queryFn: () =>
      api.get(`/conversations/${activeId}/messages`).then((r) => r.data.data ?? []),
    enabled: !!activeId,
  });

  // Send message
  const send = useMutation({
    mutationFn: (content: string) =>
      api.post(`/conversations/${activeId}/messages`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  // Socket.io for real-time
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on("message:new", (msg: Message) => {
      if (msg.conversationId === activeId) {
        qc.invalidateQueries({ queryKey: ["messages", activeId] });
      }
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => { socket.disconnect(); };
  }, [accessToken, activeId, qc]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !activeId) return;
    send.mutate(text.trim());
    socketRef.current?.emit("message:send", {
      conversationId: activeId,
      content: text.trim(),
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Left: conversation list */}
      <div className="w-72 border-r border-neutral-200 flex flex-col">
        <div className="p-4 border-b border-neutral-100">
          <p className="font-semibold text-neutral-900">Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-center text-neutral-400 text-sm p-6">No conversations yet</p>
          )}
          {conversations.map((c) => {
            const last = c.messages?.[0];
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-50 transition-colors ${
                  activeId === c.id ? "bg-primary-50 border-l-2 border-l-primary-500" : ""
                }`}
              >
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {c.patientId || c.providerId}
                </p>
                {last && (
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{last.content}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: message thread */}
      <div className="flex-1 flex flex-col">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMine = m.senderId === currentUser?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? "bg-primary-500 text-white rounded-br-sm"
                          : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                      <p className={`text-xs mt-1 ${isMine ? "text-primary-200" : "text-neutral-400"}`}>
                        {new Date(m.sentAt).toLocaleTimeString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-neutral-100 p-4 flex gap-3">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 h-11 rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || send.isPending}
                className="px-5 h-11 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
