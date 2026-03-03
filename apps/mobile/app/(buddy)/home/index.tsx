import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

export default function BuddyHome() {
  const router = useRouter();
  const { data: appointments } = useQuery({
    queryKey: ["buddy", "today"],
    queryFn: () => api.get("/appointments?limit=5&status=CONFIRMED").then((r) => r.data.data ?? []),
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="bg-primary-500 pt-16 pb-8 px-6">
        <Text className="text-white text-2xl font-bold">Talk Buddy Portal</Text>
        <Text className="text-white/70 mt-1">Thank you for supporting mental wellness</Text>
      </View>

      <View className="px-6 pt-4">
        <Text className="font-semibold text-lg text-neutral-900 mb-3">Upcoming sessions</Text>
        {(appointments ?? []).length === 0 ? (
          <View className="bg-white rounded-2xl border border-neutral-200 p-8 items-center">
            <Text className="text-neutral-400">No sessions scheduled</Text>
          </View>
        ) : (
          (appointments ?? []).map((a: {
            id: string;
            scheduledAt: string;
            duration: number;
            patient: { user: { phone: string } };
          }) => (
            <TouchableOpacity
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: "/(buddy)/session/[appointmentId]",
                  params: { appointmentId: a.id },
                })
              }
              className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
            >
              <Text className="font-semibold">{a.patient?.user?.phone}</Text>
              <Text className="text-neutral-500 text-sm mt-0.5">
                {new Date(a.scheduledAt).toLocaleString("en-NG")} · {a.duration} min
              </Text>
              <View className="mt-3 bg-primary-500 rounded-xl py-2 items-center">
                <Text className="text-white text-sm font-semibold">Join Session</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
