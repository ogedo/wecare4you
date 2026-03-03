import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function TherapistSchedule() {
  const qc = useQueryClient();
  const { data: profileData } = useQuery({
    queryKey: ["therapist", "profile"],
    queryFn: () => api.get("/users/me").then((r) => r.data.data),
  });

  const availability = (profileData?.therapistProfile?.availability as Record<string, string[]>) ?? {};

  const updateAvailability = useMutation({
    mutationFn: (avail: Record<string, string[]>) =>
      api.put("/therapists/me/availability", avail),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["therapist", "profile"] }),
  });

  const toggleSlot = (day: string, hour: string) => {
    const current = availability[day] ?? [];
    const updated = current.includes(hour)
      ? current.filter((h) => h !== hour)
      : [...current, hour];
    const newAvail = { ...availability, [day]: updated };
    updateAvailability.mutate(newAvail);
  };

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold">My Schedule</Text>
        <Text className="text-neutral-500 text-sm mt-0.5">Set your available hours</Text>
      </View>

      <View className="px-6 pt-4">
        {DAYS.map((day) => (
          <View key={day} className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3">
            <Text className="font-semibold text-neutral-900 mb-3">{day}</Text>
            <View className="flex-row flex-wrap gap-2">
              {HOURS.map((hour) => {
                const active = (availability[day] ?? []).includes(hour);
                return (
                  <TouchableOpacity
                    key={hour}
                    onPress={() => toggleSlot(day, hour)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      active ? "bg-primary-500 border-primary-500" : "border-neutral-200"
                    }`}
                  >
                    <Text className={`text-xs font-medium ${active ? "text-white" : "text-neutral-600"}`}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
