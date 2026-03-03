import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["patient", "appointments", "all"],
    queryFn: () => api.get("/appointments?limit=20").then((r) => r.data.data ?? []),
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold text-neutral-900">Your Sessions</Text>
      </View>

      <View className="px-6 pt-4">
        {isLoading ? (
          <Text className="text-center text-neutral-400 py-20">Loading...</Text>
        ) : (data ?? []).length === 0 ? (
          <View className="py-20 items-center">
            <Text className="text-4xl mb-4">📅</Text>
            <Text className="font-semibold text-neutral-700">No sessions yet</Text>
            <Text className="text-neutral-400 text-sm mt-1">Book a session to get started</Text>
          </View>
        ) : (
          (data ?? []).map((a: {
            id: string;
            scheduledAt: string;
            duration: number;
            type: string;
            status: string;
            therapist?: { user: { phone: string } };
            buddy?: { user: { phone: string } };
          }) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => {
                if (a.status === "CONFIRMED") {
                  router.push({
                    pathname: "/(patient)/session/[appointmentId]",
                    params: { appointmentId: a.id },
                  });
                }
              }}
              className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-neutral-900">
                    {a.therapist
                      ? `Therapy · ${a.therapist.user.phone}`
                      : a.buddy
                      ? `Talk Buddy · ${a.buddy.user.phone}`
                      : "Session"}
                  </Text>
                  <Text className="text-neutral-500 text-sm mt-0.5">
                    {new Date(a.scheduledAt).toLocaleString("en-NG")} · {a.duration} min
                  </Text>
                </View>
                <View className={`rounded-full px-2.5 py-0.5 ${STATUS_COLORS[a.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                  <Text className="text-xs font-medium">{a.status}</Text>
                </View>
              </View>
              {a.status === "CONFIRMED" && (
                <View className="mt-3 bg-primary-500 rounded-xl py-2 items-center">
                  <Text className="text-white text-sm font-semibold">Join Session</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
