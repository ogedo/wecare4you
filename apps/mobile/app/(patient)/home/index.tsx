import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function PatientHome() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: appointments } = useQuery({
    queryKey: ["patient", "appointments"],
    queryFn: () =>
      api.get("/appointments?limit=3&status=CONFIRMED").then((r) => r.data.data ?? []),
  });

  const { data: therapists } = useQuery({
    queryKey: ["therapists", "featured"],
    queryFn: () => api.get("/therapists?limit=3").then((r) => r.data.data ?? []),
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-primary-500 pt-16 pb-8 px-6">
        <Text className="text-white/80 text-base">Hello 👋</Text>
        <Text className="text-white text-2xl font-bold mt-1">
          {user?.phone?.slice(-4) ? `...${user.phone.slice(-4)}` : "Welcome back"}
        </Text>
        <Text className="text-white/70 text-sm mt-1">How are you feeling today?</Text>
      </View>

      <View className="px-6 -mt-4">
        {/* Quick actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push("/(patient)/therapists")}
            className="flex-1 bg-white rounded-2xl p-4 border border-neutral-200 items-center"
          >
            <Text className="text-2xl mb-1">🧠</Text>
            <Text className="font-semibold text-sm text-neutral-900">Talk to Therapist</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(patient)/buddies")}
            className="flex-1 bg-white rounded-2xl p-4 border border-neutral-200 items-center"
          >
            <Text className="text-2xl mb-1">💬</Text>
            <Text className="font-semibold text-sm text-neutral-900">Talk to Buddy</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming appointments */}
        {(appointments ?? []).length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-neutral-900 mb-3">Your next sessions</Text>
            {(appointments ?? []).map((a: {
              id: string;
              scheduledAt: string;
              duration: number;
              type: string;
              therapist?: { user: { phone: string }; sessionRate: number };
              buddy?: { user: { phone: string }; sessionRate: number };
            }) => (
              <View
                key={a.id}
                className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
              >
                <Text className="font-semibold text-neutral-900">
                  {a.therapist
                    ? `Therapy with ${a.therapist.user.phone}`
                    : a.buddy
                    ? `Talk Buddy ${a.buddy.user.phone}`
                    : "Session"}
                </Text>
                <Text className="text-neutral-500 text-sm mt-1">
                  {new Date(a.scheduledAt).toLocaleString("en-NG")} · {a.duration} min · {a.type}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Featured therapists */}
        <Text className="text-lg font-bold text-neutral-900 mb-3">Available Therapists</Text>
        {(therapists ?? []).map((t: {
          id: string;
          bio: string;
          sessionRate: number;
          specializations: string[];
          user: { phone: string };
        }) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => router.push({ pathname: "/(patient)/therapists/[id]", params: { id: t.id } })}
            className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-neutral-900">{t.user.phone}</Text>
                <Text className="text-neutral-500 text-sm mt-0.5" numberOfLines={2}>
                  {t.bio}
                </Text>
                <View className="flex-row flex-wrap gap-1 mt-2">
                  {t.specializations.slice(0, 2).map((s) => (
                    <View key={s} className="bg-primary-50 rounded-full px-2 py-0.5">
                      <Text className="text-primary-700 text-xs">{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className="items-end ml-3">
                <Text className="font-bold text-primary-600">{formatNaira(t.sessionRate)}</Text>
                <Text className="text-neutral-400 text-xs">per session</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
