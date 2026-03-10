import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/store";

export default function Index() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      router.replace("/(auth)/phone");
    } else if (user.role === "PATIENT") {
      router.replace("/(patient)/home");
    } else if (user.role === "THERAPIST") {
      router.replace("/(therapist)/home");
    } else if (user.role === "TALK_BUDDY") {
      router.replace("/(buddy)/home");
    } else if (user.role === "CRISIS_COUNSELOR") {
      router.replace("/(counselor)/queue");
    }
  }, [hydrated, user, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2a9d7f" />
    </View>
  );
}
