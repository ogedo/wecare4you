"use client";

import { X, CheckCircle, Star, Briefcase, MapPin, Phone, Mail, Calendar, Shield, Hash } from "lucide-react";
import { formatNaira } from "@wecare4you/ui";

type ProviderType = "therapist" | "buddy" | "counselor";

interface BaseProfile {
  id: string;
  bio: string;
  isApproved: boolean;
  createdAt: string;
  avgRating?: number | null;
  reviewCount?: number;
  totalSessions?: number;
  user: {
    id: string;
    phone: string;
    email?: string | null;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
  };
}

interface TherapistProfile extends BaseProfile {
  licenseNumber: string;
  licenseBody: string;
  specializations: string[];
  sessionRate: number;
  state?: string | null;
  availability?: Record<string, { start: string; end: string }[]>;
}

interface BuddyProfile extends BaseProfile {
  sessionRate: number;
  availability?: Record<string, { start: string; end: string }[]>;
}

interface CounselorProfile extends BaseProfile {}

type AnyProfile = TherapistProfile | BuddyProfile | CounselorProfile;

interface Props {
  profile: AnyProfile | null;
  type: ProviderType;
  onClose: () => void;
  onApprove: (id: string) => void;
  isApproving: boolean;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function AvailabilityGrid({ availability }: { availability?: Record<string, { start: string; end: string }[]> }) {
  if (!availability || Object.keys(availability).length === 0) {
    return <p className="text-neutral-400 text-sm">No availability set</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {DAYS.map((day) => {
        const slots = (availability[day] ?? []) as { start: string; end: string }[];
        return (
          <div key={day} className="flex items-start gap-2">
            <span className="w-24 text-xs font-medium text-neutral-500 capitalize pt-0.5">{day}</span>
            <div className="flex flex-col gap-0.5">
              {slots.length === 0 ? (
                <span className="text-xs text-neutral-300">—</span>
              ) : (
                slots.map((s, i) => (
                  <span key={i} className="text-xs bg-primary-50 text-primary-700 rounded px-1.5 py-0.5">
                    {s.start} – {s.end}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-neutral-50 rounded-xl px-4 py-3 text-center">
      <p className="text-lg font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}

export function ProviderProfileDrawer({ profile, type, onClose, onApprove, isApproving }: Props) {
  if (!profile) return null;

  const isTherapist = type === "therapist";
  const isBuddy = type === "buddy";
  const t = profile as TherapistProfile;
  const b = profile as BuddyProfile;

  const typeLabel = isTherapist ? "Therapist" : isBuddy ? "Talk Buddy" : "Crisis Counselor";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">{typeLabel} Profile</p>
            <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
              {profile.user.email ?? profile.user.phone}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Status badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              profile.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${profile.isApproved ? "bg-green-500" : "bg-amber-500"}`} />
              {profile.isApproved ? "Approved" : "Pending Review"}
            </span>
            {!profile.user.isActive && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-red-100 text-red-700">
                Suspended
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Sessions" value={profile.totalSessions ?? 0} />
            <StatPill
              label="Avg Rating"
              value={profile.avgRating != null ? `${profile.avgRating.toFixed(1)} ★` : "—"}
            />
            <StatPill label="Reviews" value={profile.reviewCount ?? 0} />
          </div>

          {/* Contact */}
          <section>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-neutral-400" />
                <span>{profile.user.phone}</span>
              </div>
              {profile.user.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-neutral-400" />
                  <span>{profile.user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span>Registered {new Date(profile.user.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            </div>
          </section>

          {/* Therapist-specific */}
          {isTherapist && (
            <>
              <section>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Licence</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-neutral-400" />
                    <span>{t.licenseNumber}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-500">{t.licenseBody}</span>
                  </div>
                  {t.state && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      <span>{t.state}</span>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Specialisations</h3>
                <div className="flex flex-wrap gap-2">
                  {t.specializations.map((s) => (
                    <span key={s} className="bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Session Rate</h3>
                <p className="text-2xl font-bold text-neutral-900">{formatNaira(t.sessionRate)}<span className="text-sm font-normal text-neutral-500"> / session</span></p>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Availability</h3>
                <AvailabilityGrid availability={t.availability} />
              </section>
            </>
          )}

          {/* Buddy-specific */}
          {isBuddy && (
            <>
              <section>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Session Rate</h3>
                <p className="text-2xl font-bold text-neutral-900">{formatNaira(b.sessionRate)}<span className="text-sm font-normal text-neutral-500"> / session</span></p>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Availability</h3>
                <AvailabilityGrid availability={b.availability} />
              </section>
            </>
          )}

          {/* Bio (all types) */}
          <section>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Bio</h3>
            <p className="text-sm text-neutral-700 leading-relaxed">{profile.bio || "No bio provided."}</p>
          </section>
        </div>

        {/* Footer actions */}
        {!profile.isApproved && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <button
              onClick={() => onApprove(profile.id)}
              disabled={isApproving}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              {isApproving ? "Approving…" : `Approve ${typeLabel}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
