"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface SessionData {
  id: string;
  roomUrl: string;
  token: string;
}

export default function TherapistSessionPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Start session (idempotent — returns existing if already started)
        const startRes = await api.post(`/sessions/${appointmentId}/start`);
        const sessionId = startRes.data.data.id;

        // Get token
        const tokenRes = await api.get(`/sessions/${appointmentId}/token`);
        const { roomUrl, token } = tokenRes.data.data;

        setSession({ id: sessionId, roomUrl, token });
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: string } } };
        setError(err.response?.data?.error || "Failed to start session");
      }
    };
    init();
  }, [appointmentId]);

  const handleEndSession = async () => {
    if (!session) return;
    setEnding(true);
    try {
      await api.patch(`/sessions/${session.id}/end`);
      router.push("/therapist/appointments");
    } catch {
      setEnding(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-neutral-100 rounded-xl text-sm font-medium hover:bg-neutral-200"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Starting session...</p>
        </div>
      </div>
    );
  }

  const iframeUrl = `${session.roomUrl}?t=${session.token}`;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Live Session</h2>
        <button
          onClick={handleEndSession}
          disabled={ending}
          className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {ending ? "Ending..." : "End Session"}
        </button>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900">
        <iframe
          src={iframeUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full"
          title="Daily.co session"
        />
      </div>
    </div>
  );
}
