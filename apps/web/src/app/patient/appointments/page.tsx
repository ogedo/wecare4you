"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  type: string;
  status: string;
  therapist?: { user: { phone: string; email?: string } };
  buddy?: { user: { phone: string; email?: string } };
  payment?: { status: string; amount: number };
  session?: { id: string };
  review?: { id: string };
}

type Tab = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-red-100 text-red-600",
};

function filterByTab(appointments: Appointment[], tab: Tab): Appointment[] {
  if (tab === "ALL") return appointments;
  if (tab === "UPCOMING") return appointments.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status));
  if (tab === "COMPLETED") return appointments.filter((a) => a.status === "COMPLETED");
  if (tab === "CANCELLED") return appointments.filter((a) => a.status === "CANCELLED");
  return appointments;
}

export default function PatientAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["patient", "appointments", "all"],
    queryFn: () => api.get("/appointments?limit=50").then((r) => r.data),
  });

  const payNow = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data: payData } = await api.post("/payments/initialize", { appointmentId });
      return payData.data?.authorizationUrl as string;
    },
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Payment failed.";
      setPayError(msg);
    },
    onSettled: () => setPayingId(null),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-1/4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-neutral-200 rounded-xl" />
        ))}
      </div>
    );
  }

  const allAppointments: Appointment[] = data?.data ?? [];
  const filtered = filterByTab(allAppointments, activeTab);

  const providerLabel = (a: Appointment) => {
    if (a.therapist?.user?.phone) return a.therapist.user.phone;
    if (a.buddy?.user?.phone) return a.buddy.user.phone;
    return "—";
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">My Appointments</h2>

      {payError && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-red-600 text-sm">
          {payError}
          <button onClick={() => setPayError(null)} className="ml-3 text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-neutral-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500 text-sm">No appointments found.</p>
          <Link
            href="/patient/therapists"
            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium inline-block"
          >
            Book a session →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Provider</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Type</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Scheduled</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Duration</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-medium text-neutral-900">{providerLabel(a)}</td>
                  <td className="px-6 py-4 capitalize text-neutral-600">{a.type.toLowerCase()}</td>
                  <td className="px-6 py-4 text-neutral-600">
                    {new Date(a.scheduledAt).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{a.duration} min</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[a.status] ?? "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.status === "CONFIRMED" && (
                        <Link
                          href={`/patient/session/${a.id}`}
                          className="text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Join Session
                        </Link>
                      )}

                      {a.status === "PENDING" && (
                        <>
                          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full">
                            Awaiting Payment
                          </span>
                          <button
                            onClick={() => {
                              setPayingId(a.id);
                              setPayError(null);
                              payNow.mutate(a.id);
                            }}
                            disabled={payNow.isPending && payingId === a.id}
                            className="text-xs font-medium text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {payNow.isPending && payingId === a.id ? "..." : "Pay Now"}
                          </button>
                        </>
                      )}

                      {a.status === "COMPLETED" && !a.review && (
                        <button
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-400 px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => {
                            // Review modal would open here — placeholder link
                            alert(`Leave a review for appointment ${a.id}`);
                          }}
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
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
