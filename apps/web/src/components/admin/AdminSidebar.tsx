"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  CreditCard,
  LogOut,
} from "lucide-react";
import { cn } from "@wecare4you/ui";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/therapists", label: "Therapists", icon: UserCheck },
  { href: "/admin/talk-buddies", label: "Talk Buddies", icon: Users },
  { href: "/admin/reports", label: "Revenue", icon: BarChart3 },
  { href: "/admin/payouts", label: "Payouts", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => {});
    logout();
    window.location.href = "/auth/login";
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-6 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-primary-600">WeCare4You</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Admin Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
