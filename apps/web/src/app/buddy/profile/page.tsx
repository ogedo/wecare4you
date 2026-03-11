"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";

interface BuddyProfile {
  id: string;
  bio: string | null;
  sessionRate: number;
  isApproved: boolean;
  averageRating: number | null;
  reviewCount: number;
}

export default function BuddyProfilePage() {
  const [bio, setBio] = useState("");
  const [sessionRateNaira, setSessionRateNaira] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: profile, isLoading } = useQuery<BuddyProfile>({
    queryKey: ["buddy-profile"],
    queryFn: () => api.get("/buddies/me/profile").then((r) => r.data.data),
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? "");
      // Convert kobo to naira for display
      setSessionRateNaira(String(Math.round(profile.sessionRate / 100)));
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      api
        .patch("/buddies/me/profile", {
          bio,
          // Convert naira back to kobo
          sessionRate: Math.round(Number(sessionRateNaira) * 100),
        })
        .then((r) => r.data),
    onSuccess: () => {
      setToast({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setToast({
        type: "error",
        text: err?.response?.data?.error ?? "Failed to update profile",
      });
      setTimeout(() => setToast(null), 4000);
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-1">My Profile</h2>
      <p className="text-neutral-500 mb-8">Update your Talk Buddy profile information</p>

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

      {isLoading ? (
        <div className="space-y-4 max-w-lg">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="max-w-lg space-y-6">
          {/* Status & ratings */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  profile?.isApproved
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {profile?.isApproved ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {profile?.isApproved ? "Approved" : "Pending Approval"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-semibold">
                {profile?.averageRating ? profile.averageRating.toFixed(1) : "—"}
              </span>
              <span className="text-neutral-400">
                ({profile?.reviewCount ?? 0} review{profile?.reviewCount !== 1 ? "s" : ""})
              </span>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <label className="text-sm font-semibold text-neutral-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              placeholder="Tell patients about yourself, your interests, and how you like to support others…"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Session rate */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <label className="text-sm font-semibold text-neutral-700">Session Rate (₦)</label>
            <p className="text-xs text-neutral-400">
              Enter the amount in Naira you charge per session
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
                ₦
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={sessionRateNaira}
                onChange={(e) => setSessionRateNaira(e.target.value)}
                placeholder="2500"
                className="h-11 w-full rounded-xl border border-neutral-200 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="h-11 px-8 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {save.isPending ? "Saving…" : "Save Profile"}
          </button>
        </div>
      )}
    </div>
  );
}
