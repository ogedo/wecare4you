import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react-native";
import { api } from "@/lib/api";

export default function ReviewScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      api.post("/reviews", { appointmentId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      Alert.alert("Thank you!", "Your review has been submitted.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to submit review";
      Alert.alert("Error", msg);
    },
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-primary-600">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-neutral-900">Rate Your Session</Text>
        <Text className="text-neutral-500 text-sm mt-1">Your feedback helps others find great providers</Text>
      </View>

      <View className="px-6 pt-8">
        {/* Star rating */}
        <Text className="font-semibold text-neutral-900 mb-4 text-center text-base">
          How would you rate this session?
        </Text>
        <View className="flex-row justify-center gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Star
                size={40}
                color={star <= rating ? "#f59e0b" : "#e5e7eb"}
                fill={star <= rating ? "#f59e0b" : "transparent"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <Text className="text-center text-neutral-500 text-sm mb-6">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </Text>
        )}

        {/* Comment */}
        <Text className="font-semibold text-neutral-900 mb-2">Add a comment (optional)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share more about your experience..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="border border-neutral-200 rounded-2xl p-4 text-sm text-neutral-900 mb-8"
          style={{ minHeight: 100 }}
        />

        <TouchableOpacity
          onPress={() => submit.mutate()}
          disabled={rating === 0 || submit.isPending}
          className={`h-14 rounded-2xl items-center justify-center ${
            rating > 0 ? "bg-primary-500" : "bg-neutral-200"
          }`}
        >
          {submit.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`font-semibold text-base ${rating > 0 ? "text-white" : "text-neutral-400"}`}
            >
              Submit Review
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
