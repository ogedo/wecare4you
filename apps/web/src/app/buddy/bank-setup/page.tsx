"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle } from "lucide-react";

export default function BuddyBankSetupPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [resolved, setResolved] = useState<{ accountName: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: banks } = useQuery({
    queryKey: ["banks"],
    queryFn: () => api.get("/payments/banks").then((r) => r.data.data ?? []),
  });

  const resolve = useMutation({
    mutationFn: () =>
      api.post("/payments/onboard-bank", { accountNumber, bankCode }).then((r) => r.data.data),
    onSuccess: (data) => {
      setResolved(data);
      setSuccess(true);
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Bank Account Setup</h2>
      <p className="text-neutral-500 mb-8">
        Add your Nigerian bank account to receive session payouts via Paystack.
      </p>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 max-w-md flex flex-col items-center text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
          <p className="font-semibold text-green-800 text-lg">Account verified!</p>
          <p className="text-green-700 mt-1">{resolved?.accountName}</p>
          <p className="text-green-600 text-sm mt-2">
            Payouts will be sent to this account after each completed session.
          </p>
        </div>
      ) : (
        <div className="max-w-md space-y-5">
          <div>
            <label className="text-sm font-medium text-neutral-900">Bank</label>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select your bank</option>
              {(banks ?? []).map((b: { code: string; name: string }) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-900">Account Number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit NUBAN"
              className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Your account name will be verified via Paystack — no BVN required
            </p>
          </div>

          {resolve.isError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {(resolve.error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to verify account"}
            </div>
          )}

          <button
            onClick={() => resolve.mutate()}
            disabled={accountNumber.length !== 10 || !bankCode || resolve.isPending}
            className="h-11 px-6 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {resolve.isPending ? "Verifying…" : "Verify & Save Account"}
          </button>
        </div>
      )}
    </div>
  );
}
