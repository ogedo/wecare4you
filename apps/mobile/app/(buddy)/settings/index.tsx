import { useState } from "react";
import {
  ScrollView, View, Text, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};
const SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
               "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

type Availability = Record<string, string[]>;

export default function BuddySettingsScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const [bio, setBio] = useState("");
  const [rateText, setRateText] = useState("");
  const [availability, setAvailability] = useState<Availability>({});
  const [activeDay, setActiveDay] = useState<string>("monday");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["buddy", "me"],
    queryFn: () => api.get("/buddies/me/profile").then((r) => r.data.data),
    onSuccess: (d: { bio: string; sessionRate: number; availability: Availability }) => {
      setBio(d.bio ?? "");
      setRateText(d.sessionRate ? String(Math.round(d.sessionRate / 100)) : "");
      setAvailability((d.availability as Availability) ?? {});
    },
  });

  function toggleSlot(day: string, slot: string) {
    setAvailability((prev) => {
      const current = prev[day] ?? [];
      const updated = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot].sort();
      return { ...prev, [day]: updated };
    });
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await api.patch("/buddies/me/profile", {
        bio,
        sessionRate: Math.round(parseFloat(rateText) * 100),
      });
      qc.invalidateQueries({ queryKey: ["buddy", "me"] });
      Alert.alert("Saved", "Profile updated.");
    } catch {
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAvailability() {
    setSavingAvail(true);
    try {
      await api.put("/buddies/me/availability", availability);
      Alert.alert("Saved", "Availability updated.");
    } catch {
      Alert.alert("Error", "Failed to save availability.");
    } finally {
      setSavingAvail(false);
    }
  }

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive",
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2a9d7f" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold text-neutral-900">Settings</Text>
        <Text className="text-neutral-500 text-sm mt-1">{user?.phone}</Text>
      </View>

      <View className="px-6 pt-6 gap-4">
        {/* Profile section */}
        <View className="bg-white rounded-2xl border border-neutral-200 p-5">
          <Text className="font-semibold text-neutral-900 mb-4">Profile</Text>

          <Text className="text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="Tell patients a bit about yourself..."
            className="bg-neutral-50 rounded-xl p-3 text-sm text-neutral-900 mb-4"
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />

          <Text className="text-xs text-neutral-500 mb-1 font-medium uppercase tracking-wide">
            Session Rate (₦ per session)
          </Text>
          <TextInput
            value={rateText}
            onChangeText={setRateText}
            keyboardType="numeric"
            placeholder="e.g. 5000"
            className="bg-neutral-50 rounded-xl px-4 py-3 text-sm text-neutral-900 mb-4"
          />

          <TouchableOpacity
            onPress={saveProfile}
            disabled={savingProfile}
            className="bg-primary-500 rounded-2xl py-3 items-center"
          >
            {savingProfile
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold">Save Profile</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Availability section */}
        <View className="bg-white rounded-2xl border border-neutral-200 p-5">
          <Text className="font-semibold text-neutral-900 mb-4">Availability</Text>

          {/* Day selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setActiveDay(d)}
                className={`mr-2 px-3 py-2 rounded-xl border ${
                  activeDay === d
                    ? "bg-primary-500 border-primary-500"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <Text className={`text-xs font-medium ${activeDay === d ? "text-white" : "text-neutral-600"}`}>
                  {DAY_LABELS[d]}
                </Text>
                {(availability[d]?.length ?? 0) > 0 && (
                  <View className="absolute -top-1 -right-1 w-2 h-2 bg-primary-400 rounded-full" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time slots */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SLOTS.map((slot) => {
              const active = (availability[activeDay] ?? []).includes(slot);
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => toggleSlot(activeDay, slot)}
                  className={`px-3 py-2 rounded-xl border ${
                    active ? "bg-primary-500 border-primary-500" : "border-neutral-200"
                  }`}
                >
                  <Text className={`text-xs font-medium ${active ? "text-white" : "text-neutral-600"}`}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={saveAvailability}
            disabled={savingAvail}
            className="bg-primary-500 rounded-2xl py-3 items-center"
          >
            {savingAvail
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold">Save Availability</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-neutral-100 rounded-2xl py-4 items-center mb-8"
        >
          <Text className="text-neutral-700 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
