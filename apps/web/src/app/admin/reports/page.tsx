"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#2a9d7f",
  COMPLETED: "#6366f1",
  CANCELLED: "#ef4444",
};

interface Analytics {
  appointmentsByStatus: Record<string, number>;
  topProviders: { name: string; sessions: number; earnings: number }[];
}

const PERIODS = ["7d", "30d", "90d"] as const;

export default function RevenueReportPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => api.get("/admin/revenue").then((r) => r.data.data),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["admin", "analytics", period],
    queryFn: () => api.get(`/admin/analytics?period=${period}`).then((r) => r.data.data),
  });

  const pieData = Object.entries(analytics?.appointmentsByStatus ?? {}).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Revenue Report</h2>

      {/* Totals */}
      {revLoading ? (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-neutral-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">Total Collected</p>
            <p className="text-3xl font-bold text-neutral-900 mt-1">
              {formatNaira(revenue?.totalAmountKobo ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">WeCare4You Commission</p>
            <p className="text-3xl font-bold text-primary-600 mt-1">
              {formatNaira(revenue?.totalCommissionKobo ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {analyticsLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-64 bg-neutral-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Appointment Status Pie */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Appointments by Status</h3>
            {pieData.length === 0 ? (
              <p className="text-center text-neutral-400 py-12 text-sm">No appointment data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#9ca3af"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Providers table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-900">Top Providers</h3>
            </div>
            {(analytics?.topProviders ?? []).length === 0 ? (
              <p className="text-center text-neutral-400 py-12 text-sm">No provider data</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Provider</th>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Sessions</th>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(analytics?.topProviders ?? []).map((p, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 font-medium text-neutral-900 truncate max-w-[200px]">{p.name}</td>
                      <td className="px-6 py-4 text-neutral-600">{p.sessions}</td>
                      <td className="px-6 py-4 text-primary-600 font-semibold">{formatNaira(p.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payment transaction list */}
          {!revLoading && (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h3 className="font-semibold text-neutral-900">All Transactions</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Reference</th>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Amount</th>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Commission</th>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Provider Pay</th>
                    <th className="px-6 py-3 text-left font-medium text-neutral-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(revenue?.payments ?? []).map((p: {
                    paystackReference: string;
                    amount: number;
                    platformFee: number;
                    paidAt?: string;
                  }) => (
                    <tr key={p.paystackReference} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 font-mono text-xs">{p.paystackReference}</td>
                      <td className="px-6 py-4 font-semibold">{formatNaira(p.amount)}</td>
                      <td className="px-6 py-4 text-primary-600">{formatNaira(p.platformFee)}</td>
                      <td className="px-6 py-4 text-neutral-600">{formatNaira(p.amount - p.platformFee)}</td>
                      <td className="px-6 py-4 text-neutral-400">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-NG") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
