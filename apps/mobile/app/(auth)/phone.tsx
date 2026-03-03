import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("+234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setError("");
    if (!/^\+234[0-9]{10}$/.test(phone)) {
      setError("Enter a valid Nigerian number: +2348012345678");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone });
      router.push({ pathname: "/(auth)/otp", params: { phone } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white px-6 pt-20"
    >
      <Text className="text-3xl font-bold text-primary-600 mb-2">WeCare4You</Text>
      <Text className="text-neutral-500 text-base mb-10">
        Talk to someone who understands
      </Text>

      <Text className="text-lg font-semibold text-neutral-900 mb-1">
        Enter your phone number
      </Text>
      <Text className="text-sm text-neutral-500 mb-6">
        We'll send a verification code via SMS
      </Text>

      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        className="h-14 border border-neutral-200 rounded-2xl px-4 text-base text-neutral-900 mb-4"
        placeholder="+2348012345678"
        maxLength={14}
      />

      {error ? (
        <Text className="text-red-500 text-sm mb-4">{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSendOtp}
        disabled={loading}
        className="h-14 bg-primary-500 rounded-2xl items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")} className="mt-6 items-center">
        <Text className="text-primary-600 text-sm">Sign in with email instead</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
