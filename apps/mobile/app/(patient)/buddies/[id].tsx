import { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function BuddyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<"VIDEO" | "AUDIO">("AUDIO");

  const { data: buddy, isLoading } = useQuery({
    queryKey: ["buddy", id],
    queryFn: () => api.get(`/buddies/${id}`).then((r) => r.data.data),
  });

  const book = useMutation({
    mutationFn: () =>
      api.post("/appointments", {
        buddyId: id,
        scheduledAt: selectedSlot,
        duration,
        type,
      }),
    onSuccess: async (res) => {
      const appointmentId = res.data.data.id;
      const payRes = await api.post("/payments/initialize", { appointmentId });
      const { authorizationUrl } = payRes.data.data;
      router.push({
        pathname: "/(patient)/session/payment",
        params: { url: authorizationUrl, appointmentId },
      });
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2a9d7f" />
      </View>
    );
  }

  // Demo time slots — next 3 days, 4 slots each
  const slots: string[] = [];
  for (let d = 1; d <= 3; d++) {
    const base = new Date();
    base.setDate(base.getDate() + d);
    for (const h of [9, 11, 14, 16]) {
      const s = new Date(base);
      s.setHours(h, 0, 0, 0);
      slots.push(s.toISOString());
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-14 pb-6 px-6 bg-primary-500">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-white">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">{buddy?.user?.phone}</Text>
        <Text className="text-white/80 text-sm mt-1">Talk Buddy · Peer Support</Text>
      </View>

      <View className="px-6 py-6">
        {/* Bio */}
        <Text className="text-neutral-700 mb-6">{buddy?.bio}</Text>

        {/* Rate */}
        <View className="flex-row justify-between items-center mb-6 p-4 bg-primary-50 rounded-2xl">
          <View>
            <Text className="text-primary-600 text-sm">Peer Support</Text>
            <Text className="font-semibold text-neutral-900">Talk Buddy</Text>
          </View>
          <View className="items-end">
            <Text className="text-primary-600 text-sm">Session rate</Text>
            <Text className="font-bold text-xl">{formatNaira(buddy?.sessionRate ?? 0)}</Text>
          </View>
        </View>

        {/* Session type */}
        <Text className="font-semibold text-neutral-900 mb-3">Session type</Text>
        <View className="flex-row gap-3 mb-6">
          {(["VIDEO", "AUDIO"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 py-3 rounded-2xl border-2 items-center ${
                type === t ? "border-primary-500 bg-primary-50" : "border-neutral-200"
              }`}
            >
              <Text className="text-lg">{t === "VIDEO" ? "📹" : "🎙"}</Text>
              <Text className={`text-sm font-medium ${type === t ? "text-primary-700" : "text-neutral-600"}`}>
                {t === "VIDEO" ? "Video" : "Audio only"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text className="font-semibold text-neutral-900 mb-3">Duration</Text>
        <View className="flex-row gap-3 mb-6">
          {[30, 60].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDuration(d)}
              className={`flex-1 py-3 rounded-2xl border-2 items-center ${
                duration === d ? "border-primary-500 bg-primary-50" : "border-neutral-200"
              }`}
            >
              <Text className={`font-medium ${duration === d ? "text-primary-700" : "text-neutral-600"}`}>
                {d} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time slots */}
        <Text className="font-semibold text-neutral-900 mb-3">Choose a time</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {slots.map((slot) => {
            const d = new Date(slot);
            const label = d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
            const time = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
            return (
              <TouchableOpacity
                key={slot}
                onPress={() => setSelectedSlot(slot)}
                className={`px-3 py-2 rounded-xl border ${
                  selectedSlot === slot ? "border-primary-500 bg-primary-50" : "border-neutral-200"
                }`}
              >
                <Text className={`text-xs font-medium ${selectedSlot === slot ? "text-primary-700" : "text-neutral-600"}`}>
                  {label}
                </Text>
                <Text className={`text-xs ${selectedSlot === slot ? "text-primary-500" : "text-neutral-400"}`}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => book.mutate()}
          disabled={!selectedSlot || book.isPending}
          className={`h-14 rounded-2xl items-center justify-center ${
            selectedSlot ? "bg-primary-500" : "bg-neutral-200"
          }`}
        >
          {book.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className={`font-semibold text-base ${selectedSlot ? "text-white" : "text-neutral-400"}`}>
              Book & Pay {selectedSlot ? formatNaira(buddy?.sessionRate ?? 0) : ""}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
