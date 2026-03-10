"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CheckCircle, XCircle } from "lucide-react";

function PaymentVerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = params.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }
    api.get(`/payments/verify/${reference}`)
      .then((r) => {
        setStatus(r.data.data?.paid ? "success" : "failed");
      })
      .catch(() => setStatus("failed"));
  }, [reference]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-10 max-w-sm w-full text-center">
      {status === "loading" && (
        <>
          <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="font-semibold text-neutral-700">Verifying payment…</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Payment Confirmed</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Your session is booked and confirmed. You'll receive a notification when it's time.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
          >
            Back to home
          </button>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Payment Unsuccessful</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Something went wrong. If your card was charged, please contact support.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full h-11 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-colors"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Suspense
        fallback={
          <div className="bg-white rounded-2xl border border-neutral-200 p-10 max-w-sm w-full text-center">
            <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
            <p className="font-semibold text-neutral-700">Loading…</p>
          </div>
        }
      >
        <PaymentVerifyContent />
      </Suspense>
    </div>
  );
}
