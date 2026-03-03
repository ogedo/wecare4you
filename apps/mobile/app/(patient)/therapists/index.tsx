import { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

const STATES = ["Lagos", "Abuja", "Rivers", "Oyo", "Kano", "Delta", "Enugu"];

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function TherapistListScreen() {
  const router = useRouter();
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["therapists", selectedState],
    queryFn: () =>
      api.get(`/therapists?limit=20${selectedState ? `&state=${selectedState}` : ""}`)
        .then((r) => r.data.data ?? []),
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold text-neutral-900">Find a Therapist</Text>
        <Text className="text-neutral-500 text-sm mt-1">
          Licensed professionals ready to help
        </Text>
      </View>

      {/* State filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 py-3 bg-white border-b border-neutral-100"
      >
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
            onPress={() => setSelectedState(s)}
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
