"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";

export default function BuddyEarningsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["buddy", "payouts"],
    queryFn: () => api.get("/admin/payouts").then((r) => r.data),
  });

  const payouts = data?.data ?? [];
  const total = payouts.reduce(
    (s: number, p: { providerAmount?: number }) => s + (p.providerAmount ?? 0),
    0
  );
  const pending = payouts.filter((p: { payoutSentAt?: string }) => !p.payoutSentAt).length;

  if (isLoading) return <div className="text-center py-20 text-neutral-400">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Earnings</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Total Earned</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{formatNaira(total)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Pending Payouts</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pending}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Appointment</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Your Payout</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {payouts.map((p: {
              id: string;
              appointmentId: string;
              providerAmount?: number;
              payoutSentAt?: string;
              paidAt?: string;
            }) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                  {p.appointmentId.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 font-semibold">{formatNaira(p.providerAmount ?? 0)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.payoutSentAt ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {p.payoutSentAt ? "Paid" : "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-400">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-NG") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payouts.length === 0 && (
          <div className="py-16 text-center text-neutral-400">No earnings yet</div>
        )}
      </div>
    </div>
  );
}
