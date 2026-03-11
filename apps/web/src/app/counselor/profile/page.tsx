"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle, XCircle, User } from "lucide-react";
import { api } from "@/lib/api";

interface CrisisProfile {
  id: string;
  bio: string | null;
  isApproved: boolean;
  user: {
    phone: string;
    email?: string;
  };
}

export default function CounselorProfilePage() {
  const [bio, setBio] = useState("");
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: profile, isLoading } = useQuery<CrisisProfile>({
    queryKey: ["crisis-profile"],
    queryFn: () => api.get("/crisis/profile").then((r) => r.data.data),
  });

  useEffect(() => {
    if (profile?.bio) {
      setBio(profile.bio);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => api.put("/crisis/profile", { bio }).then((r) => r.data),
    onSuccess: () => {
      setToastMsg({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setToastMsg(null), 4000);
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setToastMsg({
        type: "error",
        text: err?.response?.data?.error ?? "Failed to update profile",
      });
      setTimeout(() => setToastMsg(null), 4000);
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-1">My Profile</h2>
      <p className="text-neutral-500 mb-8">Manage your counselor profile and information</p>

      {toastMsg && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            toastMsg.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toastMsg.text}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4 max-w-lg">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="max-w-lg space-y-6">
          {/* Approval status */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                profile?.isApproved ? "bg-green-50" : "bg-orange-50"
              }`}
            >
              {profile?.isApproved ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-orange-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Account Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                  profile?.isApproved
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {profile?.isApproved ? "Approved" : "Pending Approval"}
              </span>
            </div>
          </div>

          {/* Contact info (read-only) */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-neutral-400" />
              <p className="text-sm font-semibold text-neutral-700">Contact Information</p>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Phone
              </label>
              <p className="mt-1 h-10 flex items-center px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-700">
                {profile?.user?.phone ?? "—"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Email
              </label>
              <p className="mt-1 h-10 flex items-center px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-700">
                {profile?.user?.email ?? "Not set"}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <p className="text-sm font-semibold text-neutral-700">Bio</p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              placeholder="Tell patients a bit about your background and approach to crisis counselling…"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="h-11 px-6 bg-primary-500 text-white rounded-xl font-semibold text-sm hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {save.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
