import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";

export default function PaymentWebView() {
  const { url, appointmentId } = useLocalSearchParams<{ url: string; appointmentId: string }>();
  const router = useRouter();

  const handleNavigationChange = async (navState: { url: string }) => {
    // Detect Paystack callback URL
    if (navState.url.includes("payment/verify")) {
      const urlObj = new URL(navState.url);
      const reference = urlObj.searchParams.get("reference");
      if (reference) {
        try {
          await api.get(`/payments/verify/${reference}`);
        } catch (_) {}
        router.replace({
          pathname: "/(patient)/session/[appointmentId]",
          params: { appointmentId },
        });
      }
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="pt-14 pb-4 px-6 flex-row items-center gap-4 border-b border-neutral-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary-600">Cancel</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-neutral-900 flex-1 text-center">Secure Payment</Text>
        <View className="w-12" />
      </View>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#2a9d7f" size="large" />
          </View>
        )}
      />
    </View>
  );
}
