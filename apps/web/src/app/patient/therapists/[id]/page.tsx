"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, MapPin, Award, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

interface TherapistProfile {
  id: string;
  user: { phone: string; email?: string };
  bio?: string;
  specializations: string[];
  sessionRate: number;
  state?: string;
  licenseNumber?: string;
  licenseBody?: string;
  avgRating?: number;
  reviewCount?: number;
}

const DURATIONS = [30, 45, 60];
const SESSION_TYPES = ["VIDEO", "AUDIO"] as const;
type SessionType = (typeof SESSION_TYPES)[number];

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export default function TherapistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>("VIDEO");
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch therapist profile
  const { data: therapist, isLoading: loadingProfile, error: profileError } = useQuery<TherapistProfile>({
    queryKey: ["therapist", id],
    queryFn: () => api.get(`/therapists/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  // Fetch availability slots
  const { data: slots = [], isLoading: loadingSlots } = useQuery<Slot[]>({
    queryKey: ["therapist", id, "slots", selectedDate, selectedDuration],
    queryFn: () =>
      api
        .get(`/therapists/${id}/slots?date=${selectedDate}&duration=${selectedDuration}`)
        .then((r) => r.data.data ?? []),
    enabled: !!id && !!selectedDate,
  });

  // Book appointment + initialize payment
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error("Please select a time slot.");

      const { data: apptData } = await api.post("/appointments", {
        therapistId: id,
        scheduledAt: selectedSlot,
        duration: selectedDuration,
        type: sessionType,
      });
      const appointmentId = apptData.data?.id;

      const { data: payData } = await api.post("/payments/initialize", { appointmentId });
      return payData.data?.authorizationUrl as string;
    },
    onSuccess: (url) => {
      if (url) {
        window.location.href = url;
      } else {
        router.push("/patient/appointments");
      }
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Booking failed. Please try again.";
      setBookingError(msg);
    },
  });

  if (loadingProfile) {
    return (
      <div className="animate-pulse space-y-4 max-w-3xl">
        <div className="h-8 bg-neutral-200 rounded w-1/3" />
        <div className="h-32 bg-neutral-200 rounded-2xl" />
        <div className="h-48 bg-neutral-200 rounded-2xl" />
      </div>
    );
  }

  if (profileError || !therapist) {
    return (
      <div className="max-w-3xl">
        <p className="text-red-500">Failed to load therapist profile.</p>
        <Link href="/patient/therapists" className="text-primary-600 text-sm mt-2 inline-block">
          ← Back to therapists
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/patient/therapists"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to therapists
      </Link>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{therapist.user.phone}</h2>
            {therapist.user.email && (
              <p className="text-sm text-neutral-400">{therapist.user.email}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary-600">{formatNaira(therapist.sessionRate)}</p>
            <p className="text-xs text-neutral-400">per session</p>
          </div>
        </div>

        {therapist.avgRating != null && (
          <div className="flex items-center gap-1.5 text-sm text-amber-500">
            <Star className="h-4 w-4 fill-amber-400" />
            <span className="font-semibold">{therapist.avgRating.toFixed(1)}</span>
            <span className="text-neutral-400">
              ({therapist.reviewCount ?? 0} review{therapist.reviewCount !== 1 ? "s" : ""})
            </span>
          </div>
        )}

        {therapist.bio && (
          <p className="text-sm text-neutral-600 leading-relaxed">{therapist.bio}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
          {therapist.state && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-neutral-400" />
              {therapist.state}
            </span>
          )}
          {therapist.licenseNumber && (
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-neutral-400" />
              {therapist.licenseBody ? `${therapist.licenseBody} · ` : ""}
              {therapist.licenseNumber}
            </span>
          )}
        </div>

        {therapist.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {therapist.specializations.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-3 py-1 text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Booking section */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
        <h3 className="font-semibold text-neutral-900">Book a Session</h3>

        {/* Date picker */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            min={todayString()}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="h-10 rounded-xl border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Duration selector */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Duration</label>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setSelectedDuration(d);
                  setSelectedSlot(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  selectedDuration === d
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Available Times</label>
          {loadingSlots ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-neutral-200 rounded-xl" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-neutral-400">No available slots for this date.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => {
                const time = new Date(slot.start).toLocaleTimeString("en-NG", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });
                const isSelected = selectedSlot === slot.start;
                return (
                  <button
                    key={slot.start}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                      !slot.available
                        ? "border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed"
                        : isSelected
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-neutral-200 text-neutral-700 hover:border-primary-300"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Session type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Session Type</label>
          <div className="flex gap-2">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSessionType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  sessionType === t
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {t === "VIDEO" ? "Video Call" : "Audio Call"}
              </button>
            ))}
          </div>
        </div>

        {bookingError && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{bookingError}</p>
        )}

        <button
          onClick={() => {
            setBookingError(null);
            bookMutation.mutate();
          }}
          disabled={!selectedSlot || bookMutation.isPending}
          className="w-full py-3 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {bookMutation.isPending ? "Processing..." : "Book Session"}
        </button>
        {!selectedSlot && (
          <p className="text-xs text-neutral-400 text-center">
            Please select a date and time slot to continue.
          </p>
        )}
      </div>
    </div>
  );
}
