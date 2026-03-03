import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useLocalSearchParams } from "expo-router";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function MessagesScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);
  const [selectedConv, setSelectedConv] = useState<string | null>(conversationId ?? null);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get("/conversations").then((r) => r.data.data ?? []),
  });

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", selectedConv],
    queryFn: () =>
      selectedConv
        ? api.get(`/conversations/${selectedConv}/messages`).then((r) => r.data.data ?? [])
        : Promise.resolve([]),
    enabled: !!selectedConv,
  });

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(BASE_URL, { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on("message:new", () => refetch());

    return () => { socket.disconnect(); };
  }, [accessToken]);

  useEffect(() => {
    if (selectedConv && socketRef.current) {
      socketRef.current.emit("join:conversation", selectedConv);
    }
  }, [selectedConv]);

  const sendMsg = useMutation({
    mutationFn: () => api.post(`/conversations/${selectedConv}/messages`, { content: input }),
    onSuccess: () => {
      setInput("");
      refetch();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  if (!selectedConv) {
    return (
      <ScrollView className="flex-1 bg-neutral-50">
        <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100">
          <Text className="text-xl font-bold">Messages</Text>
        </View>
        <View className="px-6 pt-4">
          {(conversations ?? []).length === 0 ? (
            <View className="py-20 items-center">
              <Text className="text-4xl mb-4">💬</Text>
              <Text className="text-neutral-500">No conversations yet</Text>
            </View>
          ) : (
            (conversations ?? []).map((c: {
              id: string;
              providerId: string;
              messages: Array<{ content: string; sentAt: string }>;
            }) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedConv(c.id)}
                className="bg-white rounded-2xl border border-neutral-200 p-4 mb-3"
              >
                <Text className="font-semibold text-neutral-900">{c.providerId.slice(0, 8)}...</Text>
                {c.messages?.[0] && (
                  <Text className="text-neutral-500 text-sm mt-0.5" numberOfLines={1}>
                    {c.messages[0].content}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <View className="pt-14 pb-4 px-6 bg-white border-b border-neutral-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => setSelectedConv(null)}>
          <Text className="text-primary-600">←</Text>
        </TouchableOpacity>
        <Text className="font-semibold text-neutral-900">Conversation</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-4"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {(messages ?? []).map((m: {
          id: string;
          senderId: string;
          content: string;
          sentAt: string;
        }) => {
          const isMine = m.senderId === user?.id;
          return (
            <View key={m.id} className={`mb-3 ${isMine ? "items-end" : "items-start"}`}>
              <View
                className={`max-w-xs px-4 py-3 rounded-2xl ${
                  isMine ? "bg-primary-500" : "bg-neutral-100"
                }`}
              >
                <Text className={isMine ? "text-white" : "text-neutral-900"}>{m.content}</Text>
              </View>
              <Text className="text-xs text-neutral-400 mt-1">
                {new Date(m.sentAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View className="flex-row items-center px-4 pb-6 pt-2 gap-3 border-t border-neutral-100">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          className="flex-1 h-11 bg-neutral-100 rounded-2xl px-4 text-sm"
          multiline
        />
        <TouchableOpacity
          onPress={() => sendMsg.mutate()}
          disabled={!input.trim()}
          className={`h-11 w-11 rounded-2xl items-center justify-center ${
            input.trim() ? "bg-primary-500" : "bg-neutral-200"
          }`}
        >
          <Text className="text-white font-bold">→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
