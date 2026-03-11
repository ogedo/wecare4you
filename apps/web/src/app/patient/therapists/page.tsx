"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Star } from "lucide-react";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";

interface Therapist {
  id: string;
  user: { phone: string; email?: string };
  bio?: string;
  specializations: string[];
  sessionRate: number;
  state?: string;
  licenseNumber?: string;
  avgRating?: number;
  reviewCount?: number;
}

function TherapistCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse space-y-3">
      <div className="h-4 bg-neutral-200 rounded w-2/3" />
      <div className="h-3 bg-neutral-200 rounded w-1/3" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-neutral-200 rounded-full" />
        <div className="h-6 w-20 bg-neutral-200 rounded-full" />
      </div>
      <div className="h-4 bg-neutral-200 rounded w-1/4" />
      <div className="h-9 bg-neutral-200 rounded-xl mt-2" />
    </div>
  );
}

export default function BrowseTherapistsPage() {
  const [stateInput, setStateInput] = useState("");
  const [specInput, setSpecInput] = useState("");
  const [activeState, setActiveState] = useState("");
  const [activeSpec, setActiveSpec] = useState("");

  const { data, isLoading, error } = useQuery<Therapist[]>({
    queryKey: ["therapists", "browse", activeState, activeSpec],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "20" });
      if (activeState) params.set("state", activeState);
      if (activeSpec) params.set("specialization", activeSpec);
      return api.get(`/therapists?${params}`).then((r) => r.data.data ?? []);
    },
  });

  const therapists = data ?? [];

  const handleSearch = () => {
    setActiveState(stateInput.trim());
    setActiveSpec(specInput.trim());
  };

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Find a Therapist</h2>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-neutral-500 mb-1">State</label>
          <input
            type="text"
            value={stateInput}
            onChange={(e) => setStateInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. Lagos"
            className="w-full h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-neutral-500 mb-1">Specialization</label>
          <input
            type="text"
            value={specInput}
            onChange={(e) => setSpecInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. Anxiety"
            className="w-full h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-4 h-9 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {/* Results */}
      {error ? (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-8 text-center text-red-600 text-sm">
          Failed to load therapists. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <TherapistCardSkeleton key={i} />
          ))}
        </div>
      ) : therapists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500 text-sm">No therapists found matching your criteria.</p>
          <button
            onClick={() => {
              setStateInput("");
              setSpecInput("");
              setActiveState("");
              setActiveSpec("");
            }}
            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {therapists.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col gap-3 hover:shadow-sm transition"
            >
              <div>
                <p className="font-semibold text-neutral-900">{t.user.phone}</p>
                {t.user.email && (
                  <p className="text-xs text-neutral-400 mt-0.5">{t.user.email}</p>
                )}
              </div>

              {t.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.specializations.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                  {t.specializations.length > 3 && (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-500 px-2.5 py-0.5 text-xs">
                      +{t.specializations.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">
                  {formatNaira(t.sessionRate)} / session
                </span>
                {t.state && <span className="text-neutral-400">{t.state}</span>}
              </div>

              {t.avgRating != null && (
                <div className="flex items-center gap-1 text-sm text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-medium">{t.avgRating.toFixed(1)}</span>
                  {t.reviewCount != null && (
                    <span className="text-neutral-400 text-xs ml-1">({t.reviewCount} reviews)</span>
                  )}
                </div>
              )}

              <Link
                href={`/patient/therapists/${t.id}`}
                className="mt-auto w-full text-center py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                View &amp; Book
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
