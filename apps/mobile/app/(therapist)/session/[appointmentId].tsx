import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";

export default function TherapistSessionScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{ roomUrl: string; token: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function joinSession() {
      try {
        await api.post(`/sessions/${appointmentId}/start`).catch(() => {});
        const { data } = await api.get(`/sessions/${appointmentId}/token`);
        setSessionData(data.data);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || "Failed to start session");
      } finally {
        setLoading(false);
      }
    }
    joinSession();
  }, [appointmentId]);

  const endSession = async () => {
    try {
      const { data } = await api.get(`/sessions/${appointmentId}/token`);
      if (data.data?.sessionId) await api.patch(`/sessions/${data.data.sessionId}/end`).catch(() => {});
    } catch {}
    router.replace("/(therapist)/home");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <ActivityIndicator color="#2a9d7f" size="large" />
        <Text className="text-white/70 mt-4">Starting session...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900 px-6">
        <Text className="text-white text-lg font-semibold mb-2">Session error</Text>
        <Text className="text-white/60 text-center mb-6">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary-500 px-6 py-3 rounded-xl">
          <Text className="text-white font-medium">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dailyUrl = `${sessionData!.roomUrl}?t=${sessionData!.token}`;

  return (
    <View className="flex-1 bg-neutral-900">
      <WebView
        source={{ uri: dailyUrl }}
        style={{ flex: 1 }}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
      />
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <TouchableOpacity onPress={endSession} className="bg-red-500 px-8 py-3 rounded-full">
          <Text className="text-white font-semibold">End Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
