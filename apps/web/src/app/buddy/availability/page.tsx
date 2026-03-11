"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Day = (typeof DAYS)[number];
type TimeSlot = { start: string; end: string };
type Availability = Record<Day, TimeSlot[]>;

function dayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function emptyAvailability(): Availability {
  return Object.fromEntries(DAYS.map((d) => [d, []])) as unknown as Availability;
}

export default function BuddyAvailabilityPage() {
  const [availability, setAvailability] = useState<Availability>(emptyAvailability());
  const [enabled, setEnabled] = useState<Record<Day, boolean>>(
    Object.fromEntries(DAYS.map((d) => [d, false])) as Record<Day, boolean>
  );
  const [saved, setSaved] = useState(false);

  const { data: profileData, isLoading } = useQuery<{ availability?: Partial<Availability> }>({
    queryKey: ["buddy-profile"],
    queryFn: () => api.get("/buddies/me/profile").then((r) => r.data.data),
  });

  useEffect(() => {
    if (profileData?.availability) {
      const merged = emptyAvailability();
      const enabledMap = Object.fromEntries(DAYS.map((d) => [d, false])) as Record<Day, boolean>;
      for (const day of DAYS) {
        const slots = profileData.availability![day] ?? [];
        merged[day] = slots;
        if (slots.length > 0) enabledMap[day] = true;
      }
      setAvailability(merged);
      setEnabled(enabledMap);
    }
  }, [profileData]);

  const save = useMutation({
    mutationFn: () => {
      const payload: Partial<Availability> = {};
      for (const day of DAYS) {
        if (enabled[day] && availability[day].length > 0) {
          payload[day] = availability[day];
        } else {
          payload[day] = [];
        }
      }
      return api.put("/buddies/me/availability", { availability: payload }).then((r) => r.data);
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    },
  });

  const addSlot = (day: Day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }],
    }));
  };

  const removeSlot = (day: Day, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateSlot = (day: Day, index: number, field: "start" | "end", value: string) => {
    setAvailability((prev) => {
      const slots = [...prev[day]];
      slots[index] = { ...slots[index], [field]: value };
      return { ...prev, [day]: slots };
    });
  };

  const toggleDay = (day: Day) => {
    setEnabled((prev) => {
      const next = { ...prev, [day]: !prev[day] };
      if (!prev[day] && availability[day].length === 0) {
        addSlot(day);
      }
      return next;
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-1">Availability</h2>
      <p className="text-neutral-500 mb-8">
        Set the days and time slots when you are available for sessions
      </p>

      {saved && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Availability saved successfully
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {DAYS.map((d) => (
            <div key={d} className="h-20 bg-neutral-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day) => (
            <div
              key={day}
              className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
            >
              {/* Day header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      enabled[day] ? "bg-primary-500" : "bg-neutral-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        enabled[day] ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <p className="font-semibold text-neutral-900">{dayLabel(day)}</p>
                </div>
                {enabled[day] && (
                  <button
                    onClick={() => addSlot(day)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add slot
                  </button>
                )}
              </div>

              {/* Slots */}
              {enabled[day] && (
                <div className="px-5 py-3 space-y-2">
                  {availability[day].length === 0 ? (
                    <p className="text-sm text-neutral-400 py-1">
                      No slots — click &quot;Add slot&quot; above
                    </p>
                  ) : (
                    availability[day].map((slot, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-neutral-500 w-10">Start</label>
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlot(day, i, "start", e.target.value)}
                            className="h-9 rounded-xl border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-neutral-500 w-8">End</label>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlot(day, i, "end", e.target.value)}
                            className="h-9 rounded-xl border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <button
                          onClick={() => removeSlot(day, i)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {!enabled[day] && (
                <div className="px-5 py-3">
                  <p className="text-xs text-neutral-400">Unavailable</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="h-11 px-8 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {save.isPending ? "Saving…" : "Save Availability"}
        </button>
      </div>
    </div>
  );
}
