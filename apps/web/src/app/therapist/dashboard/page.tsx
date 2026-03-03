"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";
import { Calendar, DollarSign } from "lucide-react";

export default function TherapistDashboard() {
  const { data: appointments } = useQuery({
    queryKey: ["therapist", "appointments"],
    queryFn: () =>
      api.get("/appointments?limit=5&status=CONFIRMED").then((r) => r.data.data ?? []),
  });

  const { data: earnings } = useQuery({
    queryKey: ["therapist", "earnings"],
    queryFn: () => api.get("/admin/payouts").then((r) => r.data.data ?? []),
  });

  const totalEarned = (earnings ?? []).reduce(
    (s: number, p: { providerAmount?: number }) => s + (p.providerAmount ?? 0),
    0
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Welcome back</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-start gap-4">
          <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Upcoming sessions</p>
            <p className="text-2xl font-bold mt-1">{(appointments ?? []).length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-start gap-4">
          <div className="bg-green-50 text-green-600 p-3 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Total earnings</p>
            <p className="text-2xl font-bold mt-1">{formatNaira(totalEarned)}</p>
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-3">Upcoming Appointments</h3>
      <div className="space-y-3">
        {(appointments ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-400">
            No upcoming appointments
          </div>
        ) : (
          (appointments ?? []).map((a: {
            id: string;
            scheduledAt: string;
            duration: number;
            type: string;
            patient: { user: { phone: string } };
          }) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{a.patient?.user?.phone}</p>
                <p className="text-sm text-neutral-400">
                  {new Date(a.scheduledAt).toLocaleString("en-NG")} · {a.duration} min · {a.type}
                </p>
              </div>
              <span className="bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-xs font-medium">
                Confirmed
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
