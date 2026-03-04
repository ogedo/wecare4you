"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/admin/users").then((r) => r.data),
  });

  if (isLoading) return <div className="animate-pulse space-y-4 pt-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-neutral-200 rounded-xl" />)}</div>;

  const users = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Users</h2>
        <p className="text-neutral-500 text-sm">
          {data?.meta?.total ?? 0} total
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Phone</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Email</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Role</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Verified</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((u: {
              id: string;
              phone: string;
              email?: string;
              role: string;
              isVerified: boolean;
              createdAt: string;
            }) => (
              <tr key={u.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-medium">{u.phone}</td>
                <td className="px-6 py-4 text-neutral-500">{u.email || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.role === "ADMIN" ? "bg-purple-100 text-purple-700"
                    : u.role === "THERAPIST" ? "bg-blue-100 text-blue-700"
                    : u.role === "TALK_BUDDY" ? "bg-accent-100 text-accent-700"
                    : "bg-primary-100 text-primary-700"
                  }`}>
                    {u.role.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={u.isVerified ? "text-green-600" : "text-neutral-400"}>
                    {u.isVerified ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-400">
                  {new Date(u.createdAt).toLocaleDateString("en-NG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
