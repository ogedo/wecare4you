"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function TherapistPatientsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["therapist", "completed-appointments"],
    queryFn: () =>
      api.get("/appointments?limit=100&status=COMPLETED").then((r) => r.data.data ?? []),
  });

  const uniquePatients = Array.from(
    new Map(
      (data ?? []).map((a: {
        patient: { id: string; user: { phone: string; email?: string } };
      }) => [a.patient.id, a.patient])
    ).values()
  ) as Array<{ id: string; user: { phone: string; email?: string } }>;

  if (isLoading) return <div className="animate-pulse space-y-4 pt-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-neutral-200 rounded-xl" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Patients</h2>
        <p className="text-neutral-500 text-sm">{uniquePatients.length} total</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Phone</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Email</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Sessions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {uniquePatients.map((p) => {
              const sessionCount = (data ?? []).filter(
                (a: { patient: { id: string } }) => a.patient.id === p.id
              ).length;
              return (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-medium">{p.user.phone}</td>
                  <td className="px-6 py-4 text-neutral-500">{p.user.email || "—"}</td>
                  <td className="px-6 py-4">
                    <span className="bg-primary-50 text-primary-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {sessionCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {uniquePatients.length === 0 && (
          <div className="py-16 text-center text-neutral-400">No patients yet</div>
        )}
      </div>
    </div>
  );
}
