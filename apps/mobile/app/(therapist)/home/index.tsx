import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

export default function TherapistHome() {
  const router = useRouter();
  const { data: appointments } = useQuery({
    queryKey: ["therapist", "today"],
    queryFn: () =>
      api.get("/appointments?limit=5&status=CONFIRMED").then((r) => r.data.data ?? []),
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="bg-primary-600 pt-16 pb-8 px-6">
        <Text className="text-white text-2xl font-bold">Good morning</Text>
        <Text className="text-white/70 mt-1">Here's your schedule</Text>
      </View>

      <View className="px-6 pt-4">
        <Text className="font-semibold text-lg text-neutral-900 mb-3">Today's sessions</Text>
        {(appointments ?? []).length === 0 ? (
          <View className="bg-white rounded-2xl border border-neutral-200 p-8 items-center">
            <Text className="text-neutral-400">No sessions scheduled</Text>
          </View>
        ) : (
          (appointments ?? []).map((a: {
            id: string;
            scheduledAt: string;
            duration: number;
            type: string;
            patient: { user: { phone: string } };
          }) => (
            <TouchableOpacity
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: "/(therapist)/session/[appointmentId]",
                  params: { appointmentId: a.id },
                })
              }
              className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
            >
              <Text className="font-semibold">{a.patient?.user?.phone}</Text>
              <Text className="text-neutral-500 text-sm mt-0.5">
                {new Date(a.scheduledAt).toLocaleString("en-NG")} · {a.duration} min · {a.type}
              </Text>
              <View className="mt-3 bg-primary-500 rounded-xl py-2 items-center">
                <Text className="text-white text-sm font-semibold">Start Session</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
