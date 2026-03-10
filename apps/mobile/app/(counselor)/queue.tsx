import { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { io, type Socket } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface QueueSession {
  id: string;
  createdAt: string;
  patient: { phone: string };
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function CounselorQueueScreen() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: sessions = [], isLoading, refetch, isRefetching } = useQuery<QueueSession[]>({
    queryKey: ["crisis", "queue"],
    queryFn: () => api.get("/crisis/sessions/queue").then((r) => r.data.data ?? []),
    refetchInterval: 30000, // Poll every 30s as backup to socket
  });

  // Socket.io for live incoming sessions
  useEffect(() => {
    if (!accessToken) return;
    const socket = io(API_URL, { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on("crisis:incoming", () => {
      qc.invalidateQueries({ queryKey: ["crisis", "queue"] });
    });

    return () => { socket.disconnect(); };
  }, [accessToken, qc]);

  const accept = useMutation({
    mutationFn: (sessionId: string) => api.post(`/crisis/sessions/${sessionId}/accept`),
    onMutate: (sessionId) => setAccepting(sessionId),
    onSuccess: (_, sessionId) => {
      setAccepting(null);
      qc.invalidateQueries({ queryKey: ["crisis", "queue"] });
      router.push({
        pathname: "/(counselor)/chat/[id]",
        params: { id: sessionId },
      });
    },
    onError: () => setAccepting(null),
  });

  function timeWaiting(createdAt: string) {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (mins < 1) return "just now";
    return `${mins}m ago`;
  }

  return (
    <View className="flex-1 bg-neutral-50">
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
        <Text className="text-xl font-bold text-neutral-900">Crisis Queue</Text>
        <Text className="text-neutral-500 text-sm mt-1">
          {sessions.length > 0
            ? `${sessions.length} patient${sessions.length > 1 ? "s" : ""} waiting for support`
            : "No patients waiting right now"}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ef4444" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#ef4444"
            />
          }
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-4xl mb-4">✅</Text>
              <Text className="font-semibold text-neutral-700">All clear</Text>
              <Text className="text-neutral-400 text-sm mt-1 text-center">
                No patients waiting. Pull to refresh or new sessions will appear automatically.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <Text className="font-semibold text-neutral-900">Crisis Session</Text>
                  </View>
                  <Text className="text-neutral-500 text-sm mt-1">
                    Waiting {timeWaiting(item.createdAt)}
                  </Text>
                </View>
                <View className="bg-red-50 rounded-full px-2.5 py-0.5">
                  <Text className="text-red-600 text-xs font-medium">URGENT</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => accept.mutate(item.id)}
                disabled={accepting === item.id}
                className="bg-red-500 rounded-xl py-3 items-center"
              >
                {accepting === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-semibold">Accept & Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
