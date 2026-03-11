"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Phone, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type CrisisStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "active"
  | "error";

interface CrisisSession {
  id: string;
  status: string;
}

interface CrisisMessage {
  id: string;
  content: string;
  senderId: string;
  sentAt?: string;
  createdAt?: string;
}

const HOTLINES = [
  { label: "Nigeria Suicide Prevention (No-Panic)", number: "0800-NOPANIC", tel: "080066726342" },
  { label: "Mentally Aware Nigeria Initiative", number: "08091116264", tel: "08091116264" },
  { label: "Lagos Emergency", number: "767 / 112", tel: "767" },
];

export default function CrisisSupportPage() {
  const [status, setStatus] = useState<CrisisStatus>("idle");
  const [session, setSession] = useState<CrisisSession | null>(null);
  const [messages, setMessages] = useState<CrisisMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Start crisis session
  const startSession = useMutation({
    mutationFn: () => api.post("/crisis/sessions").then((r) => r.data.data as CrisisSession),
    onSuccess: (sess) => {
      setSession(sess);
      setStatus("waiting");
      startPolling(sess.id);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to start crisis session. Please call a hotline directly.";
      setErrorMsg(msg);
      setStatus("error");
    },
  });

  const startPolling = (sessionId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get("/crisis/active");
        const activeSession = data.data;
        if (activeSession && activeSession.id === sessionId && activeSession.status === "ACTIVE") {
          setSession(activeSession);
          setStatus("active");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Keep polling — counselor might not have joined yet
      }
    }, 5000);
  };

  // Send message in active crisis session
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!session) throw new Error("No active session");
      const { data } = await api.post(`/crisis/sessions/${session.id}/messages`, { content });
      return data.data as CrisisMessage;
    },
    onSuccess: (msg) => {
      setMessages((prev) => [...prev, msg]);
      setMsgText("");
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSend = () => {
    if (!msgText.trim()) return;
    sendMessage.mutate(msgText.trim());
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Crisis Support</h2>
      <p className="text-neutral-500 text-sm mb-8">
        You&apos;re not alone. Connect with a trained crisis counselor right now.
      </p>

      {/* SOS Section */}
      {status === "idle" && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-10 text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-red-700 mb-2">Need immediate help?</h3>
          <p className="text-red-600 text-sm mb-6">
            Tap the button below to connect with a crisis counselor.
          </p>
          <button
            onClick={() => {
              setErrorMsg(null);
              setStatus("connecting");
              startSession.mutate();
            }}
            disabled={startSession.isPending}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 text-white rounded-2xl text-base font-bold hover:bg-red-600 disabled:opacity-70 transition-colors shadow-md"
          >
            <AlertTriangle className="h-5 w-5" />
            Start Crisis Session
          </button>
        </div>
      )}

      {status === "connecting" && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-10 text-center mb-8">
          <Loader2 className="h-10 w-10 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-red-700 font-semibold">Connecting you to a counselor...</p>
        </div>
      )}

      {status === "waiting" && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-10 text-center mb-8">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-amber-700 font-semibold text-lg">Looking for a counselor...</p>
          <p className="text-amber-600 text-sm mt-2">
            Please wait. A trained counselor will join shortly (usually under 60 seconds).
          </p>
          <p className="text-amber-500 text-xs mt-4">
            If no counselor is available, please call a hotline below immediately.
          </p>
        </div>
      )}

      {status === "active" && session && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 mb-6">
          <p className="text-green-700 font-semibold text-sm">
            Counselor connected! You can chat below.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-6 text-center mb-8">
          <p className="text-red-600 font-semibold mb-2">Could not start session</p>
          {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
          <button
            onClick={() => {
              setStatus("idle");
              setErrorMsg(null);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Chat interface — shown when active */}
      {status === "active" && session && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-8">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50">
            <p className="font-semibold text-neutral-900 text-sm">Crisis Chat</p>
          </div>

          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-neutral-400 text-sm text-center pt-4">
                Say hello — your counselor is here to help.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={m.id ?? i} className="flex justify-end">
                <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm bg-red-500 text-white rounded-br-sm">
                  {m.content}
                  <p className="text-xs mt-1 text-red-200">
                    {new Date(m.sentAt ?? m.createdAt ?? Date.now()).toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-neutral-100 p-4 flex gap-3">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your message..."
              className="flex-1 h-11 rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={handleSend}
              disabled={!msgText.trim() || sendMessage.isPending}
              className="px-4 h-11 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Emergency Hotlines */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-neutral-500" />
          Emergency Hotlines
        </h3>
        <div className="space-y-3">
          {HOTLINES.map((h) => (
            <div
              key={h.tel}
              className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition"
            >
              <p className="text-sm text-neutral-700 font-medium">{h.label}</p>
              <a
                href={`tel:${h.tel}`}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-semibold hover:text-primary-700"
              >
                <Phone className="h-3.5 w-3.5" />
                {h.number}
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-4">
          These lines are available 24/7. If you are in immediate danger, call 767 or 112 right away.
        </p>
      </div>
    </div>
  );
}
