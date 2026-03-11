"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Users, Activity, AlertCircle, Clock } from "lucide-react";
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

export default function CounselorDashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: activeSession, isLoading: activeLoading } = useQuery<CrisisSession | null>({
    queryKey: ["crisis-active"],
    queryFn: () =>
      api.get("/crisis/active").then((r) => r.data.data ?? null).catch(() => null),
  });

  const { data: queue = [], isLoading: queueLoading } = useQuery<CrisisSession[]>({
    queryKey: ["crisis-queue"],
    queryFn: () => api.get("/crisis/queue").then((r) => r.data.data ?? []),
  });

  const accept = useMutation({
    mutationFn: (sessionId: string) =>
      api.patch(`/crisis/sessions/${sessionId}/accept`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crisis-queue"] });
      qc.invalidateQueries({ queryKey: ["crisis-active"] });
      router.push("/counselor/queue");
    },
  });

  const isLoading = activeLoading || queueLoading;

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-1">Dashboard</h2>
      <p className="text-neutral-500 mb-8">Crisis counselor overview</p>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-neutral-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Active session banner */}
          {activeSession && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">You have an active crisis session</p>
                  <p className="text-sm text-green-600">
                    Started {relativeTime(activeSession.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/counselor/queue")}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                Go to Queue
              </button>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-sm font-medium text-neutral-500">Patients Waiting</p>
              </div>
              <p className="text-3xl font-bold text-neutral-900">{queue.length}</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    activeSession ? "bg-green-50" : "bg-neutral-50"
                  }`}
                >
                  <Activity
                    className={`h-5 w-5 ${activeSession ? "text-green-500" : "text-neutral-400"}`}
                  />
                </div>
                <p className="text-sm font-medium text-neutral-500">Active Session</p>
              </div>
              <p className="text-3xl font-bold text-neutral-900">
                {activeSession ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-neutral-400">No</span>
                )}
              </p>
            </div>
          </div>

          {/* Queue list */}
          <div className="bg-white rounded-2xl border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">Waiting Patients</h3>
              {queue.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {queue.length} waiting
                </span>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-10 w-10 text-neutral-300 mb-3" />
                <p className="font-medium text-neutral-500">No patients in queue</p>
                <p className="text-sm text-neutral-400 mt-1">
                  You will be notified when someone needs help
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {queue.map((session) => (
                  <div key={session.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 bg-neutral-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-neutral-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {session.patient?.phone
                            ? session.patient.phone.replace(/(\+\d{3})\d{4}(\d{4})/, "$1****$2")
                            : `Patient ${session.patientId.slice(0, 8)}…`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-neutral-400" />
                          <p className="text-xs text-neutral-400">
                            Waiting {relativeTime(session.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => accept.mutate(session.id)}
                      disabled={accept.isPending || !!activeSession}
                      className="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors"
                    >
                      {accept.isPending ? "Accepting…" : "Accept"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
