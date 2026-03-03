"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";
import { CheckCircle } from "lucide-react";

export default function AdminTherapistsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "therapists"],
    queryFn: () => api.get("/therapists?limit=50").then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/therapists/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });

  if (isLoading) return <div className="text-center py-20 text-neutral-400">Loading...</div>;

  const therapists = data?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Therapists</h2>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Provider</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">License</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Specializations</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Rate</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">State</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {therapists.map((t: {
              id: string;
              licenseNumber: string;
              licenseBody: string;
              specializations: string[];
              sessionRate: number;
              state?: string;
              isApproved: boolean;
              user: { phone: string; email?: string };
            }) => (
              <tr key={t.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4">
                  <p className="font-medium">{t.user.phone}</p>
                  <p className="text-neutral-400 text-xs">{t.user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <p>{t.licenseNumber}</p>
                  <p className="text-neutral-400 text-xs">{t.licenseBody}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {t.specializations.slice(0, 2).map((s) => (
                      <span key={s} className="bg-primary-50 text-primary-700 rounded-full px-2 py-0.5 text-xs">
                        {s}
                      </span>
                    ))}
                    {t.specializations.length > 2 && (
                      <span className="text-neutral-400 text-xs">+{t.specializations.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">{formatNaira(t.sessionRate)}/session</td>
                <td className="px-6 py-4">{t.state || "—"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.isApproved
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {t.isApproved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {!t.isApproved && (
                    <button
                      onClick={() => approve.mutate(t.id)}
                      disabled={approve.isPending}
                      className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {therapists.length === 0 && (
          <div className="py-16 text-center text-neutral-400">No therapists yet</div>
        )}
      </div>
    </div>
  );
}
