"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle } from "lucide-react";

export default function AdminCrisisCounselorsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "crisis-counselors"],
    queryFn: () => api.get("/admin/crisis-counselors").then((r) => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/crisis-counselors/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });

  if (isLoading)
    return (
      <div className="animate-pulse space-y-4 pt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-neutral-200 rounded-xl" />
        ))}
      </div>
    );

  const counselors: {
    id: string;
    bio: string;
    isApproved: boolean;
    createdAt: string;
    user: { phone: string; email?: string; createdAt: string };
  }[] = data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Crisis Counselors</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Review and approve crisis counselors before they can accept sessions.
        </p>
      </div>

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
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.isApproved
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {c.isApproved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {counselors.length === 0 && (
          <div className="py-16 text-center text-neutral-400">No crisis counselors yet</div>
        )}
      </div>
    </div>
  );
}
