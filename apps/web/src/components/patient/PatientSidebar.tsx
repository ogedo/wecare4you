"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Users,
  Calendar,
  MessageSquare,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { cn } from "@wecare4you/ui";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { NotificationBell } from "@/components/layout/NotificationBell";

const NAV_ITEMS = [
  { href: "/patient/home", label: "Home", icon: LayoutDashboard, crisis: false },
  { href: "/patient/therapists", label: "Find a Therapist", icon: Search, crisis: false },
  { href: "/patient/buddies", label: "Find a Buddy", icon: Users, crisis: false },
  { href: "/patient/appointments", label: "Appointments", icon: Calendar, crisis: false },
  { href: "/patient/messages", label: "Messages", icon: MessageSquare, crisis: false },
  { href: "/patient/crisis", label: "Crisis Support", icon: AlertTriangle, crisis: true },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => {});
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-6 border-b border-neutral-200 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary-600">WeCare4You</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Patient Portal</p>
        </div>
        <NotificationBell />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, crisis }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                crisis
                  ? isActive
                    ? "bg-red-50 text-red-700"
                    : "text-red-500 hover:bg-red-50"
                  : isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
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
