"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle, Eye } from "lucide-react";
import { ProviderProfileDrawer } from "@/components/admin/ProviderProfileDrawer";

type Counselor = {
  id: string;
  bio: string;
  isApproved: boolean;
  createdAt: string;
  totalSessions?: number;
  user: { id: string; phone: string; email?: string; isActive: boolean; isVerified: boolean; createdAt: string };
};

export default function AdminCrisisCounselorsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Counselor | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "crisis-counselors"],
    queryFn: () => api.get("/admin/crisis-counselors").then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/crisis-counselors/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      setSelected((prev) => prev ? { ...prev, isApproved: true } : null);
    },
  });

  const allCounselors: Counselor[] = data?.data ?? [];
  const counselors = filter === "all" ? allCounselors : allCounselors.filter((c) =>
    filter === "pending" ? !c.isApproved : c.isApproved
  );
  const pendingCount = allCounselors.filter((c) => !c.isApproved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Crisis Counselors</h2>
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
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Counselor</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Bio</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Registered</th>
                <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {counselors.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{c.user.phone}</p>
                    <p className="text-neutral-400 text-xs">{c.user.email ?? "—"}</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-neutral-700 truncate">{c.bio || "—"}</p>
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {new Date(c.user.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelected(c)}
                        className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-700"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      {!c.isApproved && (
                        <button
                          onClick={() => approve.mutate(c.id)}
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
          {counselors.length === 0 && (
            <div className="py-16 text-center text-neutral-400">No crisis counselors found</div>
          )}
        </div>
      )}

      <ProviderProfileDrawer
        profile={selected}
        type="counselor"
        onClose={() => setSelected(null)}
        onApprove={(id) => approve.mutate(id)}
        isApproving={approve.isPending}
      />
    </div>
  );
}
