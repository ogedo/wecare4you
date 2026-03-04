"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpToken, setOtpToken] = useState("");
  const [role, setRole] = useState<"THERAPIST" | "TALK_BUDDY">("THERAPIST");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: send OTP
  const handleSendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone });
      setStep(2);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const code = otp.join("");
      const res = await api.post("/auth/verify-otp", { phone, code });
      setOtpToken(res.data.data.otpToken);
      setStep(3);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: register
  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        phone,
        email,
        password,
        role,
        otpToken,
      });
      const { accessToken, user } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      setAuth(accessToken, user);
      router.push("/onboarding");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">WeCare4You</h1>
          <p className="text-neutral-500 mt-1">Create your provider account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= s ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-400"
              }`}>
                {s}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-primary-500" : "bg-neutral-100"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Phone */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-900">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2348012345678"
                className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleSendOtp}
              disabled={loading || !phone}
              className="w-full h-11 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-neutral-500 text-center">
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </p>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-11 h-14 text-center text-xl font-bold border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500"
                />
              ))}
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.some((d) => !d)}
              className="w-full h-11 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full text-sm text-neutral-500 hover:text-neutral-700"
            >
              Change number
            </button>
          </div>
        )}

        {/* Step 3: Role + Credentials */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-900">I am a</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["THERAPIST", "TALK_BUDDY"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      role === r
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {r === "THERAPIST" ? "Therapist" : "Talk Buddy"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-900">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-900">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleRegister}
              disabled={loading || !password}
              className="w-full h-11 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
