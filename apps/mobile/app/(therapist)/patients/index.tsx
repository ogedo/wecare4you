import { ScrollView, View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function TherapistPatients() {
  const { data } = useQuery({
    queryKey: ["therapist", "patients"],
    queryFn: () => api.get("/appointments?limit=50&status=COMPLETED").then((r) => r.data.data ?? []),
  });

  const uniquePatients = Array.from(
    new Map(
      (data ?? []).map((a: { patient: { id: string; user: { phone: string } } }) => [a.patient.id, a.patient])
    ).values()
  );

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold">My Patients</Text>
        <Text className="text-neutral-500 text-sm mt-0.5">{uniquePatients.length} total</Text>
      </View>
      <View className="px-6 pt-4">
        {uniquePatients.length === 0 ? (
          <View className="py-20 items-center">
            <Text className="text-neutral-400">No patients yet</Text>
          </View>
        ) : (
          (uniquePatients as Array<{ id: string; user: { phone: string } }>).map((p) => (
            <View key={p.id} className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3">
              <Text className="font-semibold">{p.user.phone}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
