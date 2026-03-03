import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const ROLES = [
  { value: "PATIENT", label: "I need support", sub: "Talk to therapists or buddies" },
  { value: "THERAPIST", label: "I'm a therapist", sub: "Offer professional therapy" },
  { value: "TALK_BUDDY", label: "I'm a Talk Buddy", sub: "Volunteer peer support" },
];

export default function RegisterScreen() {
  const { phone, otpToken } = useLocalSearchParams<{ phone: string; otpToken: string }>();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!role) {
      setError("Please select your role");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", { phone, otpToken, role });
      await setAuth(data.data.accessToken, data.data.user);

      if (role === "PATIENT") router.replace("/(patient)/home");
      else if (role === "THERAPIST") router.replace("/(therapist)/home");
      else router.replace("/(buddy)/home");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-20">
      <Text className="text-2xl font-bold text-neutral-900 mb-2">Welcome to WeCare4You</Text>
      <Text className="text-neutral-500 mb-8">How would you like to use the app?</Text>

      <View className="gap-3 mb-8">
        {ROLES.map(({ value, label, sub }) => (
          <TouchableOpacity
            key={value}
            onPress={() => setRole(value)}
            className={`p-5 rounded-2xl border-2 ${
              role === value
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 bg-white"
            }`}
          >
            <Text
              className={`font-semibold text-base ${
                role === value ? "text-primary-700" : "text-neutral-900"
              }`}
            >
              {label}
            </Text>
            <Text className="text-neutral-500 text-sm mt-0.5">{sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mb-6 p-4 bg-neutral-50 rounded-2xl">
        <Text className="text-xs text-neutral-500 text-center">
          By continuing, you agree to our Privacy Policy and consent to data processing under NDPR.
          Your data is stored securely and you can request deletion at any time.
        </Text>
      </View>

      {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading || !role}
        className={`h-14 rounded-2xl items-center justify-center mb-8 ${
          role ? "bg-primary-500" : "bg-neutral-200"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className={`font-semibold text-base ${role ? "text-white" : "text-neutral-400"}`}>
            Create account
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
