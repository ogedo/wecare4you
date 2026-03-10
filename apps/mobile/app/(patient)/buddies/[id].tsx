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

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function BuddyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<"VIDEO" | "AUDIO">("AUDIO");
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(new Date(Date.now() + 86400000)));

  const { data: buddy, isLoading } = useQuery({
    queryKey: ["buddy", id],
    queryFn: () => api.get(`/buddies/${id}`).then((r) => r.data.data),
  });

  const { data: packages = [] } = useQuery<{
    id: string; name: string; sessions: number; priceKobo: number;
  }[]>({
    queryKey: ["buddy-packages", buddy?.user?.id],
    queryFn: () =>
      api.get(`/packages?providerId=${buddy.user.id}&providerType=TALK_BUDDY`)
        .then((r) => r.data.data ?? []),
    enabled: !!buddy?.user?.id,
  });

  const buyPackage = useMutation({
    mutationFn: (pkgId: string) => api.post(`/packages/${pkgId}/purchase`),
    onSuccess: (res) => {
      const { authorizationUrl } = res.data.data;
      router.push({
        pathname: "/(patient)/session/payment",
        params: { url: authorizationUrl, appointmentId: "pkg" },
      });
    },
  });

  const { data: slots = [], isFetching: slotsLoading } = useQuery<{ time: string; available: boolean }[]>({
    queryKey: ["buddy-slots", id, selectedDate, duration],
    queryFn: () =>
      api.get(`/buddies/${id}/slots?date=${selectedDate}&duration=${duration}`)
        .then((r) => r.data.data ?? []),
    enabled: !!id,
  });

  const book = useMutation({
    mutationFn: () => {
      const [hours, minutes] = selectedSlot!.split(":").map(Number);
      const dt = new Date(selectedDate);
      dt.setHours(hours, minutes, 0, 0);
      return api.post("/appointments", {
        buddyId: id,
        scheduledAt: dt.toISOString(),
        duration,
        type,
      });
    },
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

  // Next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + (i + 1) * 86400000);
    return { value: toDateStr(d), label: d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" }) };
  });

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

        {/* Session Packages */}
        {packages.length > 0 && (
          <View className="mb-6">
            <Text className="font-semibold text-neutral-900 mb-3">Session Bundles</Text>
            <Text className="text-neutral-500 text-xs mb-3">Save when you buy multiple sessions upfront</Text>
            {packages.map((pkg) => {
              const perSession = Math.round(pkg.priceKobo / pkg.sessions);
              return (
                <View key={pkg.id} className="flex-row justify-between items-center border border-primary-200 bg-primary-50 rounded-2xl px-4 py-3 mb-2">
                  <View>
                    <Text className="font-semibold text-neutral-900">{pkg.name}</Text>
                    <Text className="text-neutral-500 text-xs mt-0.5">
                      {pkg.sessions} sessions · {formatNaira(perSession)}/session
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => buyPackage.mutate(pkg.id)}
                    disabled={buyPackage.isPending}
                    className="bg-primary-500 rounded-xl px-3 py-2"
                  >
                    <Text className="text-white text-xs font-semibold">{formatNaira(pkg.priceKobo)}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

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
              onPress={() => { setDuration(d); setSelectedSlot(null); }}
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

        {/* Date picker */}
        <Text className="font-semibold text-neutral-900 mb-3">Choose a date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {dates.map((d) => (
            <TouchableOpacity
              key={d.value}
              onPress={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
              className={`mr-2 px-4 py-2 rounded-xl border ${
                selectedDate === d.value ? "border-primary-500 bg-primary-50" : "border-neutral-200"
              }`}
            >
              <Text className={`text-xs font-medium ${selectedDate === d.value ? "text-primary-700" : "text-neutral-600"}`}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time slots */}
        <Text className="font-semibold text-neutral-900 mb-3">Available times</Text>
        {slotsLoading ? (
          <ActivityIndicator color="#2a9d7f" className="my-4" />
        ) : slots.length === 0 ? (
          <Text className="text-neutral-400 text-sm mb-6">No available slots on this day</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2 mb-6">
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                onPress={() => slot.available && setSelectedSlot(slot.time)}
                disabled={!slot.available}
                className={`px-4 py-2.5 rounded-xl border ${
                  !slot.available
                    ? "border-neutral-100 bg-neutral-50 opacity-40"
                    : selectedSlot === slot.time
                    ? "border-primary-500 bg-primary-50"
                    : "border-neutral-200"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    !slot.available
                      ? "text-neutral-300"
                      : selectedSlot === slot.time
                      ? "text-primary-700"
                      : "text-neutral-600"
                  }`}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
