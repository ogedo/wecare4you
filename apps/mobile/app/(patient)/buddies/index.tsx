import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { api } from "@/lib/api";

const MAX_RATES = [
  { label: "≤ ₦3k", value: 300000 },
  { label: "≤ ₦5k", value: 500000 },
  { label: "≤ ₦10k", value: 1000000 },
];

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function BuddiesScreen() {
  const router = useRouter();
  const [selectedMaxRate, setSelectedMaxRate] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["buddies", selectedMaxRate],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "20" });
      if (selectedMaxRate) params.set("maxRate", String(selectedMaxRate));
      return api.get(`/buddies?${params.toString()}`).then((r) => r.data.data ?? []);
    },
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold">Talk Buddies</Text>
        <Text className="text-neutral-500 text-sm mt-1">Peer support sessions</Text>
      </View>

      {/* Price filter */}
      <View className="px-6 py-3 bg-white border-b border-neutral-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setSelectedMaxRate(null)}
            className={`mr-2 px-4 py-2 rounded-full border ${
              !selectedMaxRate ? "bg-primary-500 border-primary-500" : "border-neutral-200 bg-white"
            }`}
          >
            <Text className={!selectedMaxRate ? "text-white text-sm font-medium" : "text-neutral-600 text-sm"}>
              All prices
            </Text>
          </TouchableOpacity>
          {MAX_RATES.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setSelectedMaxRate(selectedMaxRate === value ? null : value)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedMaxRate === value ? "bg-primary-500 border-primary-500" : "border-neutral-200 bg-white"
              }`}
            >
              <Text className={`text-sm font-medium ${selectedMaxRate === value ? "text-white" : "text-neutral-600"}`}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="px-6 pt-4">
        {isLoading ? (
          <Text className="text-center text-neutral-400 py-20">Loading...</Text>
        ) : (data ?? []).length === 0 ? (
          <Text className="text-center text-neutral-400 py-20">No buddies available</Text>
        ) : (
          (data ?? []).map((b: {
            id: string;
            bio: string;
            sessionRate: number;
            avgRating?: number;
            reviewCount?: number;
            user: { phone: string };
          }) => (
            <View key={b.id} className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-neutral-900">{b.user.phone}</Text>
                  {(b.reviewCount ?? 0) > 0 && (
                    <View className="flex-row items-center mt-1 gap-1">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-amber-600 text-xs font-medium">
                        {(b.avgRating ?? 0).toFixed(1)}
                      </Text>
                      <Text className="text-neutral-400 text-xs">({b.reviewCount})</Text>
                    </View>
                  )}
                  <Text className="text-neutral-500 text-sm mt-1" numberOfLines={2}>{b.bio}</Text>
                </View>
                <View className="items-end ml-3">
                  <Text className="font-bold text-primary-600">{formatNaira(b.sessionRate)}</Text>
                  <Text className="text-neutral-400 text-xs">/ session</Text>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/(patient)/buddies/[id]", params: { id: b.id } })}
                    className="mt-2 bg-primary-500 rounded-xl px-3 py-1.5"
                  >
                    <Text className="text-white text-xs font-medium">Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
