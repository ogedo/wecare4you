import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function BuddiesScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["buddies"],
    queryFn: () => api.get("/buddies?limit=20").then((r) => r.data.data ?? []),
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold">Talk Buddies</Text>
        <Text className="text-neutral-500 text-sm mt-1">Peer support sessions</Text>
      </View>

      <View className="px-6 pt-4">
        {isLoading ? (
          <Text className="text-center text-neutral-400 py-20">Loading...</Text>
        ) : (data ?? []).length === 0 ? (
          <Text className="text-center text-neutral-400 py-20">No buddies available</Text>
        ) : (
          (data ?? []).map((b: {
            id: string;
            bio: string;
            sessionRate: number;
            user: { phone: string };
          }) => (
            <View key={b.id} className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-neutral-900">{b.user.phone}</Text>
                  <Text className="text-neutral-500 text-sm mt-1" numberOfLines={2}>{b.bio}</Text>
                </View>
                <View className="items-end ml-3">
                  <Text className="font-bold text-primary-600">{formatNaira(b.sessionRate)}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/buddies/[id]",
                        params: { id: b.id },
                      })
                    }
                    className="mt-2 bg-primary-500 rounded-xl px-3 py-1.5"
                  >
                    <Text className="text-white text-xs font-medium">Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
