"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, ArrowUpCircle, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";

interface AdminUser {
  id: string;
  email?: string;
  phone: string;
  adminTier: "SUPER" | "STANDARD";
  createdAt: string;
}

function tierBadge(tier: "SUPER" | "STANDARD") {
  if (tier === "SUPER") return "bg-purple-100 text-purple-700";
  return "bg-blue-100 text-blue-700";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminTeamPage() {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    tier: "STANDARD" as "SUPER" | "STANDARD",
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const { data: admins = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-admins"],
    queryFn: () => api.get("/admin/admins").then((r) => r.data.data ?? []),
  });

  const addAdmin = useMutation({
    mutationFn: () => api.post("/admin/admins", form).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-admins"] });
      setForm({ email: "", phone: "", password: "", tier: "STANDARD" });
      showToast("success", "Admin added successfully");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      showToast("error", err?.response?.data?.error ?? "Failed to add admin");
    },
  });

  const promote = useMutation({
    mutationFn: (adminId: string) =>
      api.patch(`/admin/admins/${adminId}/tier`, { tier: "SUPER" }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-admins"] });
      showToast("success", "Admin promoted to Super");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      showToast("error", err?.response?.data?.error ?? "Failed to promote admin");
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Shield className="h-6 w-6 text-purple-500" />
        <h2 className="text-2xl font-bold text-neutral-900">Admin Team</h2>
      </div>
      <p className="text-neutral-500 mb-8">
        Manage admin accounts — only Super Admins can access this page
      </p>

      {toast && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.text}
        </div>
      )}

      {/* Existing admins table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-900">Current Admins</h3>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm">No admins found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Email / Phone
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-neutral-900">{admin.email ?? "—"}</p>
                    <p className="text-xs text-neutral-400">{admin.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tierBadge(
                        admin.adminTier
                      )}`}
                    >
                      {admin.adminTier === "SUPER" && <Shield className="h-3 w-3" />}
                      {admin.adminTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-500">{formatDate(admin.createdAt)}</td>
                  <td className="px-6 py-4">
                    {admin.adminTier === "STANDARD" && (
                      <button
                        onClick={() => promote.mutate(admin.id)}
                        disabled={promote.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors"
                      >
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                        Promote to Super
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add admin form */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-neutral-900">Add New Admin</h3>
        </div>

        <div className="grid grid-cols-2 gap-5 max-w-2xl">
          <div>
            <label className="text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@wecare4you.com"
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+2348012345678"
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 8 characters"
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700">Tier</label>
            <select
              value={form.tier}
              onChange={(e) =>
                setForm((f) => ({ ...f, tier: e.target.value as "SUPER" | "STANDARD" }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="STANDARD">Standard</option>
              <option value="SUPER">Super</option>
            </select>
          </div>
        </div>

        {addAdmin.isError && (
          <div className="mt-4 max-w-2xl rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {(addAdmin.error as { response?: { data?: { error?: string } } })?.response?.data
              ?.error ?? "Failed to add admin"}
          </div>
        )}

        <button
          onClick={() => addAdmin.mutate()}
          disabled={
            !form.email || !form.phone || !form.password || form.password.length < 8 || addAdmin.isPending
          }
          className="mt-6 h-11 px-6 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {addAdmin.isPending ? "Adding…" : "Add Admin"}
        </button>
      </div>
    </div>
  );
}
