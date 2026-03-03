import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

export default function BuddySessions() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["buddy", "sessions"],
    queryFn: () => api.get("/appointments?limit=20").then((r) => r.data.data ?? []),
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold">My Sessions</Text>
      </View>
      <View className="px-6 pt-4">
        {isLoading ? (
          <Text className="text-center text-neutral-400 py-20">Loading...</Text>
        ) : (data ?? []).length === 0 ? (
          <View className="py-20 items-center">
            <Text className="text-neutral-400">No sessions yet</Text>
          </View>
        ) : (
          (data ?? []).map((a: {
            id: string;
            scheduledAt: string;
            duration: number;
            status: string;
            patient: { user: { phone: string } };
          }) => (
            <TouchableOpacity
              key={a.id}
              onPress={() =>
                a.status === "CONFIRMED" &&
                router.push({ pathname: "/(buddy)/session/[appointmentId]", params: { appointmentId: a.id } })
              }
              className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
            >
              <View className="flex-row justify-between">
                <View>
                  <Text className="font-semibold">{a.patient?.user?.phone}</Text>
                  <Text className="text-neutral-500 text-sm mt-0.5">
                    {new Date(a.scheduledAt).toLocaleString("en-NG")} · {a.duration} min
                  </Text>
                </View>
                <Text className={`text-xs font-medium ${a.status === "CONFIRMED" ? "text-green-600" : "text-neutral-400"}`}>
                  {a.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
