import { ScrollView, View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function BuddyEarnings() {
  const { data } = useQuery({
    queryKey: ["buddy", "earnings"],
    queryFn: () => api.get("/admin/payouts?limit=20").then((r) => r.data.data ?? []),
  });

  const total = (data ?? []).reduce((s: number, p: { providerAmount?: number }) => s + (p.providerAmount ?? 0), 0);

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold">Earnings</Text>
      </View>
      <View className="px-6 pt-6">
        <View className="bg-primary-50 rounded-2xl p-5 mb-6">
          <Text className="text-primary-600 text-sm">Total Earned</Text>
          <Text className="text-3xl font-bold text-primary-700 mt-1">{formatNaira(total)}</Text>
        </View>
        {(data ?? []).map((p: {
          id: string;
          providerAmount?: number;
          payoutSentAt?: string;
          paidAt?: string;
        }) => (
          <View key={p.id} className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3 flex-row justify-between items-center">
            <View>
              <Text className="font-semibold">{formatNaira(p.providerAmount ?? 0)}</Text>
              <Text className="text-neutral-400 text-xs mt-0.5">
                {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-NG") : "—"}
              </Text>
            </View>
            <View className={`rounded-full px-3 py-1 ${p.payoutSentAt ? "bg-green-100" : "bg-amber-100"}`}>
              <Text className={`text-xs font-medium ${p.payoutSentAt ? "text-green-700" : "text-amber-700"}`}>
                {p.payoutSentAt ? "Paid" : "Pending"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
