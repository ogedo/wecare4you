"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNaira } from "@wecare4you/ui";

export default function RevenueReportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => api.get("/admin/revenue").then((r) => r.data.data),
  });

  if (isLoading) return <div className="animate-pulse space-y-4 pt-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-neutral-200 rounded-xl" />)}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Revenue Report</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">Total Collected</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">
            {formatNaira(data?.totalAmountKobo ?? 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="text-sm text-neutral-500">WeCare4You Commission</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">
            {formatNaira(data?.totalCommissionKobo ?? 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Reference</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Amount</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Commission</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Provider Pay</th>
              <th className="px-6 py-3 text-left font-medium text-neutral-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(data?.payments ?? []).map((p: {
              paystackReference: string;
              amount: number;
              platformFee: number;
              providerAmount?: number;
              paidAt?: string;
            }) => (
              <tr key={p.paystackReference} className="hover:bg-neutral-50">
                <td className="px-6 py-4 font-mono text-xs">{p.paystackReference}</td>
                <td className="px-6 py-4 font-semibold">{formatNaira(p.amount)}</td>
                <td className="px-6 py-4 text-primary-600">{formatNaira(p.platformFee)}</td>
                <td className="px-6 py-4 text-neutral-600">
                  {formatNaira((p.amount - p.platformFee))}
                </td>
                <td className="px-6 py-4 text-neutral-400">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-NG") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
