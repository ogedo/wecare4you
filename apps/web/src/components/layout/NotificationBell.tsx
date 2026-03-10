"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

function typeToLabel(type: string): string {
  const labels: Record<string, string> = {
    NEW_BOOKING: "New booking received",
    APPOINTMENT_CONFIRMED_PATIENT: "Session confirmed",
    APPOINTMENT_CONFIRMED_PROVIDER: "Payment received",
    SESSION_ENDED: "Session complete — rate your provider",
    REMINDER_PATIENT: "Session in 30 minutes",
    REMINDER_PROVIDER: "Session in 30 minutes",
    PAYOUT_SENT: "Payout sent",
    ACCOUNT_APPROVED: "Account approved",
    NEW_REVIEW: "New review received",
  };
  return labels[type] ?? type;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then((r) => r.data.data ?? []),
    enabled: !!accessToken,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Socket.io for live notifications
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on("notification:new", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => { socket.disconnect(); };
  }, [accessToken, qc]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-neutral-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <p className="font-semibold text-sm text-neutral-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-neutral-400 text-sm py-8">No notifications yet</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-neutral-50 ${!n.isRead ? "bg-primary-50/50" : ""}`}
                >
                  <p className={`text-sm ${!n.isRead ? "font-semibold text-neutral-900" : "text-neutral-700"}`}>
                    {typeToLabel(n.type)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
