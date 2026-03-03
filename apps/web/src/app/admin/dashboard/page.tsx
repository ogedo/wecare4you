"use client";

import { useQuery } from "@tanstack/react-query";
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

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get("/admin/stats").then((r) => r.data.data),
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}
