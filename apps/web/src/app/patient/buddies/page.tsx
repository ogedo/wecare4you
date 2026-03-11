"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";

interface Buddy {
  id: string;
  user: { phone: string; email?: string };
  bio?: string;
  sessionRate: number;
  avgRating?: number;
  reviewCount?: number;
}

function BuddyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 animate-pulse space-y-3">
      <div className="h-4 bg-neutral-200 rounded w-2/3" />
      <div className="h-3 bg-neutral-200 rounded w-1/3" />
      <div className="h-4 bg-neutral-200 rounded w-1/4" />
      <div className="h-9 bg-neutral-200 rounded-xl mt-2" />
    </div>
  );
}

export default function BrowseBuddiesPage() {
  const [maxRateInput, setMaxRateInput] = useState("");
  const [activeMaxRate, setActiveMaxRate] = useState<number | undefined>(undefined);

  const { data, isLoading, error } = useQuery<Buddy[]>({
    queryKey: ["buddies", "browse", activeMaxRate],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "20" });
      if (activeMaxRate != null) {
        // convert Naira to kobo
        params.set("maxRate", String(activeMaxRate * 100));
      }
      return api.get(`/buddies?${params}`).then((r) => r.data.data ?? []);
    },
  });

  const buddies = data ?? [];

  const handleSearch = () => {
    const parsed = parseFloat(maxRateInput);
    setActiveMaxRate(isNaN(parsed) || maxRateInput === "" ? undefined : parsed);
  };

  const handleClear = () => {
    setMaxRateInput("");
    setActiveMaxRate(undefined);
  };

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Find a Talk Buddy</h2>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Max Session Rate (₦)
          </label>
          <input
            type="number"
            min="0"
            value={maxRateInput}
            onChange={(e) => setMaxRateInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. 5000"
            className="w-full h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 h-9 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Filter
        </button>
        {activeMaxRate != null && (
          <button
            onClick={handleClear}
            className="px-4 h-9 border border-neutral-200 text-neutral-600 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {error ? (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-8 text-center text-red-600 text-sm">
          Failed to load buddies. Please try again.
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <BuddyCardSkeleton key={i} />
          ))}
        </div>
      ) : buddies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500 text-sm">No buddies found.</p>
          {activeMaxRate != null && (
            <button
              onClick={handleClear}
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buddies.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col gap-3 hover:shadow-sm transition"
            >
              <div>
                <p className="font-semibold text-neutral-900">{b.user.phone}</p>
                {b.user.email && (
                  <p className="text-xs text-neutral-400 mt-0.5">{b.user.email}</p>
                )}
              </div>

              {b.bio && (
                <p className="text-sm text-neutral-500 line-clamp-2">{b.bio}</p>
              )}

              <p className="text-sm font-medium text-neutral-900">
                {formatNaira(b.sessionRate)}{" "}
                <span className="text-neutral-400 font-normal">/ session</span>
              </p>

              {b.avgRating != null && (
                <div className="flex items-center gap-1.5 text-sm text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-medium">{b.avgRating.toFixed(1)}</span>
                  {b.reviewCount != null && (
                    <span className="text-neutral-400 text-xs ml-1">
                      ({b.reviewCount} review{b.reviewCount !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              )}

              <Link
                href={`/patient/buddies/${b.id}`}
                className="mt-auto w-full text-center py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
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
