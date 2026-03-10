"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";
import { Users, Video, TrendingUp, Clock } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPatients: number;
  totalTherapists: number;
  totalBuddies: number;
  pendingApprovals: number;
  todaySessions: number;
  totalRevenueKobo: number;
  totalCommissionKobo: number;
}

interface Analytics {
  revenueByDay: { date: string; total: number; commission: number }[];
  sessionsByDay: { date: string; count: number }[];
  appointmentsByStatus: Record<string, number>;
  topProviders: { name: string; sessions: number; earnings: number }[];
}

const PERIODS = ["7d", "30d", "90d"] as const;

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data, isLoading } = useQuery<Stats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get("/admin/stats").then((r) => r.data.data),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["admin", "analytics", period],
    queryFn: () => api.get(`/admin/analytics?period=${period}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: data?.totalUsers ?? 0,
      sub: `${data?.totalPatients ?? 0} patients`,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Providers",
      value: (data?.totalTherapists ?? 0) + (data?.totalBuddies ?? 0),
      sub: `${data?.totalTherapists ?? 0} therapists · ${data?.totalBuddies ?? 0} buddies`,
      icon: Users,
      color: "bg-primary-50 text-primary-600",
    },
    {
      label: "Sessions Today",
      value: data?.todaySessions ?? 0,
      sub: "video + audio",
      icon: Video,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Revenue",
      value: formatNaira(data?.totalRevenueKobo ?? 0),
      sub: `Commission: ${formatNaira(data?.totalCommissionKobo ?? 0)}`,
      icon: TrendingUp,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Pending Approvals",
      value: data?.pendingApprovals ?? 0,
      sub: "therapists awaiting review",
      icon: Clock,
      color: data?.pendingApprovals ? "bg-amber-50 text-amber-600" : "bg-neutral-50 text-neutral-500",
    },
  ];

  const revenueData = (analytics?.revenueByDay ?? []).map((d) => ({
    date: d.date.slice(5), // MM-DD
    Revenue: Math.round(d.total / 100),
    Commission: Math.round(d.commission / 100),
  }));

  const sessionsData = (analytics?.sessionsByDay ?? []).map((d) => ({
    date: d.date.slice(5),
    Sessions: d.count,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
                <p className="text-xs text-neutral-400 mt-1">{sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

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
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Revenue Trend (₦)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2a9d7f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2a9d7f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `₦${Number(v).toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="Revenue" stroke="#2a9d7f" fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="Commission" stroke="#f59e0b" fill="url(#colorCommission)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sessions per Day */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Sessions per Day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sessionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Sessions" fill="#2a9d7f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
