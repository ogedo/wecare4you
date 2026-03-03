import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => {});
    await logout();
    router.replace("/(auth)/phone");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Your personal data will be permanently deleted as required by NDPR. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await api.delete("/users/me");
            await logout();
            router.replace("/(auth)/phone");
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold">Settings</Text>
      </View>

      <View className="px-6 pt-6 gap-4">
        {/* Account info */}
        <View className="bg-white rounded-2xl border border-neutral-200 p-5">
          <Text className="text-xs text-neutral-400 mb-1">Phone</Text>
          <Text className="font-semibold">{user?.phone}</Text>
          {user?.email && (
            <>
              <Text className="text-xs text-neutral-400 mt-3 mb-1">Email</Text>
              <Text className="font-semibold">{user.email}</Text>
            </>
          )}
          <Text className="text-xs text-neutral-400 mt-3 mb-1">Role</Text>
          <Text className="font-semibold">{user?.role?.replace("_", " ")}</Text>
        </View>

        {/* Privacy */}
        <View className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <Text className="px-5 pt-4 pb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wide">
            Privacy (NDPR)
          </Text>
          <TouchableOpacity className="flex-row items-center justify-between px-5 py-4 border-t border-neutral-100">
            <Text className="text-neutral-900">Privacy Policy</Text>
            <Text className="text-neutral-400">→</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center justify-between px-5 py-4 border-t border-neutral-100">
            <Text className="text-neutral-900">Data & Consent Settings</Text>
            <Text className="text-neutral-400">→</Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <TouchableOpacity
            onPress={handleLogout}
            className="px-5 py-4"
          >
            <Text className="text-red-500 font-medium">Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="px-5 py-4 border-t border-neutral-100"
          >
            <Text className="text-red-500 font-medium">Delete account</Text>
            <Text className="text-neutral-400 text-xs mt-0.5">Permanently delete all your data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
