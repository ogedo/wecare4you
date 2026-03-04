"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";
import { Send } from "lucide-react";

export default function AdminPayoutsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: () => api.get("/admin/payouts").then((r) => r.data),
  });

  const triggerPayout = useMutation({
    mutationFn: (appointmentId: string) =>
      api.post(`/payments/payout/${appointmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payouts"] }),
  });

  if (isLoading) return <div className="animate-pulse space-y-4 pt-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-neutral-200 rounded-xl" />)}</div>;

  const payouts = data?.data ?? [];
  const unpaid = payouts.filter((p: { payoutSentAt?: string }) => !p.payoutSentAt);
  const totalPending = unpaid.reduce(
    (s: number, p: { providerAmount?: number }) => s + (p.providerAmount ?? 0),
    0
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-2xl font-bold">Provider Payouts</h2>
        <div className="text-right">
          <p className="text-sm text-neutral-500">{unpaid.length} pending</p>
          <p className="font-semibold text-amber-600">{formatNaira(totalPending)} outstanding</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Appointment</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Session Amount</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Provider Payout</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Commission</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Paid At</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Payout Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {payouts.map((p: {
              id: string;
              appointmentId: string;
              amount: number;
              providerAmount?: number;
              platformFee: number;
              paidAt?: string;
              payoutSentAt?: string;
            }) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                  {p.appointmentId.slice(0, 12)}...
                </td>
                <td className="px-6 py-4 font-semibold">{formatNaira(p.amount)}</td>
                <td className="px-6 py-4">{formatNaira(p.providerAmount ?? 0)}</td>
                <td className="px-6 py-4 text-primary-600">{formatNaira(p.platformFee)}</td>
                <td className="px-6 py-4 text-neutral-400">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-NG") : "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.payoutSentAt ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {p.payoutSentAt
                      ? `Sent ${new Date(p.payoutSentAt).toLocaleDateString("en-NG")}`
                      : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {!p.payoutSentAt && (
                    <button
                      onClick={() => triggerPayout.mutate(p.appointmentId)}
                      disabled={triggerPayout.isPending}
                      className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send Payout
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payouts.length === 0 && (
          <div className="py-16 text-center text-neutral-400">No payments yet</div>
        )}
      </div>
    </div>
  );
}
