"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";
import { CheckCircle } from "lucide-react";

export default function AdminBuddiesPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "buddies"],
    queryFn: () => api.get("/buddies?limit=50").then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/buddies/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });

  if (isLoading) return <div className="animate-pulse space-y-4 pt-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-neutral-200 rounded-xl" />)}</div>;

  const buddies = data?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Talk Buddies</h2>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Phone</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Rate</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {buddies.map((b: {
              id: string;
              sessionRate: number;
              isApproved: boolean;
              user: { phone: string; email?: string };
            }) => (
              <tr key={b.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4">
                  <p className="font-medium">{b.user.phone}</p>
                  <p className="text-neutral-400 text-xs">{b.user.email}</p>
                </td>
                <td className="px-6 py-4">{formatNaira(b.sessionRate)}/session</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    b.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {b.isApproved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {!b.isApproved && (
                    <button
                      onClick={() => approve.mutate(b.id)}
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
        {buddies.length === 0 && (
          <div className="py-16 text-center text-neutral-400">No talk buddies yet</div>
        )}
      </div>
    </div>
  );
}
