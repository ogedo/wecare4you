"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Clock, RefreshCw, HeartHandshake } from "lucide-react";
import { api } from "@/lib/api";

interface CrisisSession {
  id: string;
  patientId: string;
  status: string;
  createdAt: string;
  patient?: {
    phone: string;
    email?: string;
  };
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

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-orange-100 text-orange-700",
    ACTIVE: "bg-green-100 text-green-700",
    ENDED: "bg-neutral-100 text-neutral-600",
  };
  return styles[status] ?? "bg-neutral-100 text-neutral-600";
}

export default function CounselorQueuePage() {
  const qc = useQueryClient();

  const { data: queue = [], isLoading, dataUpdatedAt } = useQuery<CrisisSession[]>({
    queryKey: ["crisis-queue"],
    queryFn: () => api.get("/crisis/queue").then((r) => r.data.data ?? []),
    refetchInterval: 10000,
  });

  const accept = useMutation({
    mutationFn: (sessionId: string) =>
      api.patch(`/crisis/sessions/${sessionId}/accept`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crisis-queue"] });
      qc.invalidateQueries({ queryKey: ["crisis-active"] });
    },
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-neutral-900">Crisis Queue</h2>
        {queue.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            {queue.length} waiting
          </span>
        )}
      </div>
      <p className="text-neutral-500 mb-2">Auto-refreshes every 10 seconds</p>
      <p className="text-xs text-neutral-400 mb-8 flex items-center gap-1.5">
        <RefreshCw className="h-3 w-3" />
        Last updated: {lastUpdated}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <HeartHandshake className="h-8 w-8 text-primary-400" />
          </div>
          <p className="text-lg font-semibold text-neutral-700">No patients waiting</p>
          <p className="text-sm text-neutral-400 mt-2 max-w-xs">
            The queue is clear. Take a moment to breathe — you are doing important work.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Waiting Since
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {queue.map((session) => (
                <tr key={session.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-neutral-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {session.patient?.phone
                            ? session.patient.phone.replace(/(\+\d{3})\d{4}(\d{4})/, "$1****$2")
                            : `ID: ${session.patientId.slice(0, 8)}…`}
                        </p>
                        {session.patient?.email && (
                          <p className="text-xs text-neutral-400">{session.patient.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {relativeTime(session.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {session.status === "PENDING" && (
                      <button
                        onClick={() => accept.mutate(session.id)}
                        disabled={accept.isPending}
                        className="px-4 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                      >
                        {accept.isPending ? "Accepting…" : "Accept"}
                      </button>
                    )}
                    {session.status === "ACTIVE" && (
                      <span className="text-xs text-green-600 font-medium">In Session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
