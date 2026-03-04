"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function BuddySessionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["buddy", "sessions", "all"],
    queryFn: () => api.get("/appointments?limit=50").then((r) => r.data),
  });

  if (isLoading) return <div className="animate-pulse space-y-4 pt-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-neutral-200 rounded-xl" />)}</div>;

  const appointments = data?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Sessions</h2>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Patient</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Scheduled</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Duration</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {appointments.map((a: {
              id: string;
              scheduledAt: string;
              duration: number;
              status: string;
              patient: { user: { phone: string } };
            }) => (
              <tr key={a.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-medium">{a.patient?.user?.phone}</td>
                <td className="px-6 py-4">
                  {new Date(a.scheduledAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-6 py-4">{a.duration} min</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[a.status]}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && (
          <div className="py-16 text-center text-neutral-400">No sessions yet</div>
        )}
      </div>
    </div>
  );
}
