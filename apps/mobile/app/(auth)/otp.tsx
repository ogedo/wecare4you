import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (val: string, idx: number) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-otp", { phone, code });
      router.push({ pathname: "/(auth)/register", params: { phone, otpToken: data.data.otpToken } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await api.post("/auth/send-otp", { phone });
    setCountdown(60);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white px-6 pt-20"
    >
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className="text-primary-600">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-neutral-900 mb-2">Verify your number</Text>
      <Text className="text-neutral-500 mb-2">Enter the 6-digit code sent to</Text>
      <Text className="text-neutral-900 font-semibold mb-8">{phone}</Text>

      <View className="flex-row gap-3 mb-6">
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(r) => { if (r) inputs.current[idx] = r; }}
            value={digit}
            onChangeText={(v) => handleChange(v, idx)}
            keyboardType="number-pad"
            maxLength={1}
            className="flex-1 h-14 border-2 border-neutral-200 rounded-2xl text-center text-xl font-bold text-neutral-900"
            style={{ borderColor: digit ? "#2a9d7f" : undefined }}
          />
        ))}
      </View>

      {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

      <TouchableOpacity
        onPress={handleVerify}
        disabled={loading}
        className="h-14 bg-primary-500 rounded-2xl items-center justify-center mb-6"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={countdown > 0} className="items-center">
        <Text className={countdown > 0 ? "text-neutral-400" : "text-primary-600"}>
          {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
