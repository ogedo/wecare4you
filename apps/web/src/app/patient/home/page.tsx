"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, Stethoscope, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  type: string;
  status: string;
  therapist?: { user: { phone: string; email?: string } };
  buddy?: { user: { phone: string; email?: string } };
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-red-100 text-red-600",
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-neutral-200 rounded w-1/4" />
    </div>
  );
}

export default function PatientHomePage() {
  const user = useAuthStore((s) => s.user);

  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery<Appointment[]>({
    queryKey: ["patient", "appointments", "upcoming"],
    queryFn: () =>
      api
        .get("/appointments?limit=3&status=CONFIRMED")
        .then((r) => r.data.data ?? []),
  });

  const { data: completedData, isLoading: loadingCompleted } = useQuery<Appointment[]>({
    queryKey: ["patient", "appointments", "completed"],
    queryFn: () =>
      api
        .get("/appointments?limit=3&status=COMPLETED")
        .then((r) => r.data.data ?? []),
  });

  const upcoming = upcomingData ?? [];
  const completed = completedData ?? [];

  const providerLabel = (a: Appointment) => {
    if (a.therapist?.user?.phone) return a.therapist.user.phone;
    if (a.buddy?.user?.phone) return a.buddy.user.phone;
    return "Provider";
  };

  return (
    <div className="max-w-4xl">
      {/* Welcome header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">
          Welcome back{user?.phone ? `, ${user.phone}` : user?.email ? `, ${user.email}` : ""}
        </h2>
        <p className="text-neutral-500 mt-1">Here&apos;s your mental wellness overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {loadingUpcoming ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-start gap-4">
            <div className="bg-primary-50 text-primary-600 p-3 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Upcoming sessions</p>
              <p className="text-3xl font-bold mt-1 text-neutral-900">{upcoming.length}</p>
            </div>
          </div>
        )}

        {loadingCompleted ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-start gap-4">
            <div className="bg-green-50 text-green-600 p-3 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Completed sessions</p>
              <p className="text-3xl font-bold mt-1 text-neutral-900">{completed.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <h3 className="font-semibold text-lg text-neutral-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/patient/therapists"
          className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3 hover:border-primary-300 hover:shadow-sm transition group"
        >
          <div className="bg-primary-50 text-primary-600 w-10 h-10 rounded-xl flex items-center justify-center">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 group-hover:text-primary-700 transition">
              Book a Therapist
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">Browse certified professionals</p>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-500 transition ml-auto mt-auto" />
        </Link>

        <Link
          href="/patient/buddies"
          className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3 hover:border-green-300 hover:shadow-sm transition group"
        >
          <div className="bg-green-50 text-green-600 w-10 h-10 rounded-xl flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 group-hover:text-green-700 transition">
              Talk to a Buddy
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">Peer support, anytime</p>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-green-500 transition ml-auto mt-auto" />
        </Link>

        <Link
          href="/patient/crisis"
          className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3 hover:border-red-300 hover:shadow-sm transition group"
        >
          <div className="bg-red-50 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 group-hover:text-red-700 transition">
              Crisis Support
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">24/7 support available</p>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-red-500 transition ml-auto mt-auto" />
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-neutral-900">Upcoming Appointments</h3>
        <Link
          href="/patient/appointments"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all
        </Link>
      </div>

      {loadingUpcoming ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded-2xl" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
          <p className="text-neutral-500 text-sm">No upcoming sessions.</p>
          <Link
            href="/patient/therapists"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1 inline-block"
          >
            Book one now →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-neutral-900">{providerLabel(a)}</p>
                <p className="text-sm text-neutral-400 mt-0.5">
                  {new Date(a.scheduledAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  · {a.duration} min · {a.type}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[a.status] ?? "bg-neutral-100 text-neutral-600"}`}
              >
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
