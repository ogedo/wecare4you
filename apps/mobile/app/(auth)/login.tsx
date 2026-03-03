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
import { useAuthStore } from "@/lib/store";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await setAuth(data.data.accessToken, data.data.user);
      const role = data.data.user.role;
      if (role === "PATIENT") router.replace("/(patient)/home");
      else if (role === "THERAPIST") router.replace("/(therapist)/home");
      else router.replace("/(buddy)/home");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white px-6 pt-20"
    >
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className="text-primary-600">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-neutral-900 mb-8">Sign in with email</Text>

      <View className="gap-4 mb-6">
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          className="h-14 border border-neutral-200 rounded-2xl px-4 text-base text-neutral-900"
          placeholder="Email address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="h-14 border border-neutral-200 rounded-2xl px-4 text-base text-neutral-900"
          placeholder="Password"
        />
      </View>

      {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="h-14 bg-primary-500 rounded-2xl items-center justify-center"
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text className="text-white font-semibold text-base">Sign in</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
