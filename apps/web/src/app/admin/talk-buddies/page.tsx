"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";
import { CheckCircle, Eye } from "lucide-react";
import { ProviderProfileDrawer } from "@/components/admin/ProviderProfileDrawer";

type Buddy = {
  id: string;
  bio: string;
  sessionRate: number;
  isApproved: boolean;
  createdAt: string;
  avgRating?: number | null;
  reviewCount?: number;
  totalSessions?: number;
  availability?: Record<string, { start: string; end: string }[]>;
  user: { id: string; phone: string; email?: string; isActive: boolean; isVerified: boolean; createdAt: string };
};

export default function AdminBuddiesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Buddy | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "buddies", filter],
    queryFn: () => api.get(`/admin/buddies?status=${filter === "all" ? "" : filter}&limit=50`).then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/buddies/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      setSelected((prev) => prev ? { ...prev, isApproved: true } : null);
    },
  });

  const buddies: Buddy[] = data?.data ?? [];
  const pendingCount = buddies.filter((b) => !b.isApproved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Talk Buddies</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-1">{pendingCount} pending approval</p>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-neutral-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Talk Buddy</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Rate</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Sessions</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Rating</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {buddies.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{b.user.phone}</p>
                    <p className="text-neutral-400 text-xs">{b.user.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatNaira(b.sessionRate)}</td>
                  <td className="px-6 py-4 text-neutral-500">{b.totalSessions ?? 0}</td>
                  <td className="px-6 py-4 text-neutral-500">
                    {b.avgRating != null ? `${b.avgRating.toFixed(1)} ★` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      b.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {b.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelected(b)}
                        className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-700"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {buddies.length === 0 && (
            <div className="py-16 text-center text-neutral-400">No talk buddies found</div>
          )}
        </div>
      )}

      <ProviderProfileDrawer
        profile={selected}
        type="buddy"
        onClose={() => setSelected(null)}
        onApprove={(id) => approve.mutate(id)}
        isApproving={approve.isPending}
      />
    </div>
  );
}
