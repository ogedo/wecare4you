"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const LICENSE_BODIES = ["MDCN", "ICAN", "APA", "NIMHP", "CCPA"];

const SPECIALIZATIONS = [
  "Anxiety", "Depression", "Trauma & PTSD", "Relationship issues",
  "Grief & Loss", "Addiction", "Child & Adolescent", "Family therapy",
  "Career & Stress", "Self-esteem",
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const isTherapist = user?.role === "THERAPIST";

  const [bio, setBio] = useState("");
  const [sessionRate, setSessionRate] = useState("");
  const [state, setState] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseBody, setLicenseBody] = useState("MDCN");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSpec = (s: string) => {
    setSpecializations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const rateKobo = Math.round(parseFloat(sessionRate) * 100);
      if (isTherapist) {
        await api.patch("/therapists/me/profile", {
          bio,
          sessionRate: rateKobo,
          state,
          licenseNumber,
          licenseBody,
          specializations,
        });
        router.push("/therapist/dashboard");
      } else {
        await api.patch("/buddies/me/profile", {
          bio,
          sessionRate: rateKobo,
        });
        router.push("/buddy/dashboard");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center pt-12 mb-8">
          <h1 className="text-2xl font-bold text-primary-600">WeCare4You</h1>
          <p className="text-neutral-600 mt-1 font-medium">Set up your {isTherapist ? "therapist" : "buddy"} profile</p>
          <p className="text-neutral-400 text-sm mt-1">This helps patients find and book you</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-5">
          {isTherapist && (
            <>
              <div>
                <label className="text-sm font-medium text-neutral-900">License number</label>
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="MDC/12345/2023"
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900">Licensing body</label>
                <select
                  value={licenseBody}
                  onChange={(e) => setLicenseBody(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {LICENSE_BODIES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-900 block mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSpec(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        specializations.includes(s)
                          ? "bg-primary-500 text-white border-primary-500"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-neutral-900">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell patients about yourself, your approach, and experience..."
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-900">Session rate (₦)</label>
            <div className="mt-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₦</span>
              <input
                type="number"
                value={sessionRate}
                onChange={(e) => setSessionRate(e.target.value)}
                placeholder="10000"
                min="500"
                className="h-11 w-full rounded-xl border border-neutral-200 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-neutral-400 mt-1">Amount per session in naira</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !bio || !sessionRate}
            className="w-full h-11 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
