import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function CounselorProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["counselor", "profile"],
    queryFn: () => api.get("/crisis/me").then((r) => r.data.data),
    onSuccess: (d: { bio: string }) => setBio(d.bio ?? ""),
  });

  const save = useMutation({
    mutationFn: () => api.patch("/crisis/me", { bio }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["counselor", "profile"] });
      setEditing(false);
    },
  });

  const handleLogout = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await api.post("/auth/logout").catch(() => {});
          await logout();
          router.replace("/(auth)/phone");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#ef4444" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold text-neutral-900">Profile</Text>
      </View>

      <View className="px-6 pt-6">
        {/* Identity card */}
        <View className="bg-white rounded-2xl border border-neutral-200 p-6 mb-4">
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
            <Text className="text-3xl">🆘</Text>
          </View>
          <Text className="font-bold text-lg text-neutral-900">{user?.phone}</Text>
          <Text className="text-neutral-500 text-sm mt-0.5">Crisis Counselor</Text>
          {user?.email && (
            <Text className="text-neutral-400 text-sm mt-1">{user.email}</Text>
          )}
          <View className={`mt-3 self-start px-3 py-1 rounded-full ${
            profile?.isApproved ? "bg-green-100" : "bg-amber-100"
          }`}>
            <Text className={`text-xs font-medium ${
              profile?.isApproved ? "text-green-700" : "text-amber-700"
            }`}>
              {profile?.isApproved ? "✓ Approved" : "Pending approval"}
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View className="bg-white rounded-2xl border border-neutral-200 p-5 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-semibold text-neutral-900">Bio</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => { setBio(profile?.bio ?? ""); setEditing(true); }}>
                <Text className="text-primary-600 text-sm font-medium">Edit</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => setEditing(false)}>
                  <Text className="text-neutral-400 text-sm">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending
                    ? <ActivityIndicator size="small" color="#2a9d7f" />
                    : <Text className="text-primary-600 text-sm font-semibold">Save</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

          {editing ? (
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Describe your background and approach to crisis support..."
              className="bg-neutral-50 rounded-xl p-3 text-sm text-neutral-900"
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          ) : (
            <Text className="text-neutral-600 text-sm leading-5">
              {profile?.bio || "No bio set yet. Tap Edit to add one."}
            </Text>
          )}
        </View>

        {/* Guidelines */}
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <Text className="font-semibold text-amber-800 text-sm">Counselor Guidelines</Text>
          <Text className="text-amber-700 text-xs mt-1 leading-5">
            • Always prioritise the patient's safety{"\n"}
            • Listen actively and without judgment{"\n"}
            • Escalate to emergency services if there is immediate risk to life{"\n"}
            • Do not share personal contact details{"\n"}
            • End the session only when the patient is safe
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-neutral-100 rounded-2xl py-4 items-center"
        >
          <Text className="text-neutral-700 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
