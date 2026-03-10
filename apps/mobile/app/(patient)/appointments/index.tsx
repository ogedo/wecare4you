import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-neutral-100 text-neutral-600",
  CANCELLED: "bg-red-100 text-red-600",
};

interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  type: string;
  status: string;
  therapist?: { user: { phone: string } };
  buddy?: { user: { phone: string } };
  payment?: { status: string; paystackReference?: string };
  review?: { id: string } | null;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["patient", "appointments", "all"],
    queryFn: () => api.get("/appointments?limit=20").then((r) => r.data.data ?? []),
  });

  const initPay = useMutation({
    mutationFn: (appointmentId: string) =>
      api.post("/payments/initialize", { appointmentId }),
    onSuccess: (res, appointmentId) => {
      const { authorizationUrl } = res.data.data;
      router.push({
        pathname: "/(patient)/session/payment",
        params: { url: authorizationUrl, appointmentId },
      });
    },
  });

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold text-neutral-900">Your Sessions</Text>
      </View>

      <View className="px-6 pt-4">
        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#2a9d7f" />
          </View>
        ) : (data ?? []).length === 0 ? (
          <View className="py-20 items-center">
            <Text className="text-4xl mb-4">📅</Text>
            <Text className="font-semibold text-neutral-700">No sessions yet</Text>
            <Text className="text-neutral-400 text-sm mt-1">Book a session to get started</Text>
          </View>
        ) : (
          (data ?? []).map((a: Appointment) => {
            const needsPayment =
              a.status === "PENDING" &&
              (!a.payment || a.payment.status !== "COMPLETED");
            const canReview = a.status === "COMPLETED" && !a.review;

            return (
              <View
                key={a.id}
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
                  <View
                    className={`rounded-full px-2.5 py-0.5 ${STATUS_COLORS[a.status] ?? "bg-neutral-100 text-neutral-600"}`}
                  >
                    <Text className="text-xs font-medium">{a.status}</Text>
                  </View>
                </View>

                {needsPayment && (
                  <TouchableOpacity
                    onPress={() => initPay.mutate(a.id)}
                    disabled={initPay.isPending}
                    className="mt-3 bg-amber-500 rounded-xl py-2.5 items-center"
                  >
                    {initPay.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white text-sm font-semibold">Pay Now</Text>
                    )}
                  </TouchableOpacity>
                )}

                {a.status === "CONFIRMED" && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/session/[appointmentId]",
                        params: { appointmentId: a.id },
                      })
                    }
                    className="mt-3 bg-primary-500 rounded-xl py-2.5 items-center"
                  >
                    <Text className="text-white text-sm font-semibold">Join Session</Text>
                  </TouchableOpacity>
                )}

                {canReview && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/appointments/review",
                        params: { appointmentId: a.id },
                      })
                    }
                    className="mt-3 bg-amber-50 border border-amber-200 rounded-xl py-2.5 items-center"
                  >
                    <Text className="text-amber-700 text-sm font-semibold">⭐ Rate Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
