"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@wecare4you/types";
import type { z } from "zod";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    try {
      const res = await api.post("/auth/login", data);
      const { accessToken, user } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      // Set session signal cookie so Next.js middleware can detect auth state
      document.cookie = "wc4y_session=1; path=/; max-age=" + 7 * 24 * 3600;
      setAuth(accessToken, user);

      const routes: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        THERAPIST: "/therapist/dashboard",
        TALK_BUDDY: "/buddy/dashboard",
        CRISIS_COUNSELOR: "/counselor/dashboard",
        PATIENT: "/patient/home",
      };
      router.push(routes[user.role] ?? "/login");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">WeCare4You</h1>
          <p className="text-neutral-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-900">Email</label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-900">Password</label>
            <input
              {...register("password")}
              type="password"
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          New provider?{" "}
          <Link href="/register" className="text-primary-600 font-medium hover:underline">
            Join here →
          </Link>
        </p>
      </div>
    </div>
  );
}
