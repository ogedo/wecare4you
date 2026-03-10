import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { api } from "@/lib/api";

const STATES = ["Lagos", "Abuja", "Rivers", "Oyo", "Kano", "Delta", "Enugu"];
const SPECIALIZATIONS = [
  "Anxiety", "Depression", "Trauma", "Stress Management",
  "Relationships", "Grief", "Addiction", "CBT", "PTSD",
];
const MAX_RATES = [
  { label: "≤ ₦10k", value: 1000000 },
  { label: "≤ ₦20k", value: 2000000 },
  { label: "≤ ₦30k", value: 3000000 },
];

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function TherapistListScreen() {
  const router = useRouter();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [selectedMaxRate, setSelectedMaxRate] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["therapists", selectedState, selectedSpec, selectedMaxRate],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "20" });
      if (selectedState) params.set("state", selectedState);
      if (selectedSpec) params.set("specialization", selectedSpec);
      if (selectedMaxRate) params.set("maxRate", String(selectedMaxRate));
      return api.get(`/therapists?${params.toString()}`).then((r) => r.data.data ?? []);
    },
  });

  const activeFilters = [selectedState, selectedSpec, selectedMaxRate != null ? `≤₦${selectedMaxRate / 100 / 1000}k` : null].filter(Boolean).length;

  return (
    <ScrollView className="flex-1 bg-neutral-50" stickyHeaderIndices={[0]}>
      <View className="bg-white border-b border-neutral-100">
        <View className="pt-14 pb-4 px-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-neutral-900">Find a Therapist</Text>
              <Text className="text-neutral-500 text-sm mt-1">Licensed professionals ready to help</Text>
            </View>
            {activeFilters > 0 && (
              <TouchableOpacity
                onPress={() => { setSelectedState(null); setSelectedSpec(null); setSelectedMaxRate(null); }}
                className="bg-neutral-100 rounded-full px-3 py-1"
              >
                <Text className="text-xs text-neutral-600">Clear ({activeFilters})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* State filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-3">
          <TouchableOpacity
            onPress={() => setSelectedState(null)}
            className={`mr-2 px-4 py-2 rounded-full border ${
              !selectedState ? "bg-primary-500 border-primary-500" : "border-neutral-200 bg-white"
            }`}
          >
            <Text className={!selectedState ? "text-white text-sm font-medium" : "text-neutral-600 text-sm"}>
              All states
            </Text>
          </TouchableOpacity>
          {STATES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSelectedState(selectedState === s ? null : s)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                selectedState === s ? "bg-primary-500 border-primary-500" : "border-neutral-200 bg-white"
              }`}
            >
              <Text className={selectedState === s ? "text-white text-sm font-medium" : "text-neutral-600 text-sm"}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Specialization filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-3">
          {SPECIALIZATIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSelectedSpec(selectedSpec === s ? null : s)}
              className={`mr-2 px-3 py-1.5 rounded-full border ${
                selectedSpec === s ? "bg-teal-500 border-teal-500" : "border-neutral-200 bg-white"
              }`}
            >
              <Text className={`text-xs font-medium ${selectedSpec === s ? "text-white" : "text-neutral-600"}`}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Price filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-3">
          {MAX_RATES.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setSelectedMaxRate(selectedMaxRate === value ? null : value)}
              className={`mr-2 px-3 py-1.5 rounded-full border ${
                selectedMaxRate === value ? "bg-amber-500 border-amber-500" : "border-neutral-200 bg-white"
              }`}
            >
              <Text className={`text-xs font-medium ${selectedMaxRate === value ? "text-white" : "text-neutral-600"}`}>
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
          <Text className="text-center text-neutral-400 py-20">No therapists found</Text>
        ) : (
          (data ?? []).map((t: {
            id: string;
            bio: string;
            sessionRate: number;
            specializations: string[];
            state?: string;
            avgRating?: number;
            reviewCount?: number;
            user: { phone: string };
          }) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => router.push({ pathname: "/(patient)/therapists/[id]", params: { id: t.id } })}
              className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
            >
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-neutral-900">{t.user.phone}</Text>
                  {t.state && (
                    <Text className="text-neutral-400 text-xs mt-0.5">📍 {t.state}</Text>
                  )}
                  {(t.reviewCount ?? 0) > 0 && (
                    <View className="flex-row items-center mt-1 gap-1">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-amber-600 text-xs font-medium">
                        {(t.avgRating ?? 0).toFixed(1)}
                      </Text>
                      <Text className="text-neutral-400 text-xs">({t.reviewCount})</Text>
                    </View>
                  )}
                  <Text className="text-neutral-500 text-sm mt-1" numberOfLines={2}>{t.bio}</Text>
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {t.specializations.slice(0, 3).map((s) => (
                      <View key={s} className="bg-primary-50 rounded-full px-2 py-0.5">
                        <Text className="text-primary-700 text-xs">{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="items-end ml-3">
                  <Text className="font-bold text-primary-600 text-base">{formatNaira(t.sessionRate)}</Text>
                  <Text className="text-neutral-400 text-xs">/ session</Text>
                  <View className="mt-2 bg-primary-500 rounded-xl px-3 py-1.5">
                    <Text className="text-white text-xs font-medium">Book</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
