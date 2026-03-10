import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface CrisisMessage {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function CounselorChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<CrisisMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load existing messages
    api.get(`/crisis/sessions/${id}/messages`)
      .then((r) => setMessages(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Connect socket
    const socket = io(API_URL, { auth: { token: accessToken } });
    socketRef.current = socket;
    socket.emit("join:crisis", id);

    socket.on("crisis:message:new", (msg: CrisisMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("crisis:ended", () => {
      Alert.alert("Session Ended", "The patient has ended the crisis session.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    });

    return () => { socket.disconnect(); };
  }, [id, accessToken]);

  function sendMessage() {
    if (!text.trim() || !socketRef.current) return;
    const content = text.trim();
    setText("");
    socketRef.current.emit("crisis:message:send", { sessionId: id, content });
  }

  function endSession() {
    Alert.alert("End Session", "End this crisis session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: async () => {
          await api.post(`/crisis/sessions/${id}/end`).catch(() => {});
          socketRef.current?.disconnect();
          router.back();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#ef4444" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View className="pt-14 pb-3 px-4 bg-red-500 flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold text-base">Crisis Session</Text>
          <Text className="text-red-100 text-xs mt-0.5">Active — patient connected</Text>
        </View>
        <TouchableOpacity
          onPress={endSession}
          className="bg-red-700 rounded-xl px-3 py-1.5"
        >
          <Text className="text-white text-xs font-semibold">End Session</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text className="text-center text-neutral-400 text-sm mt-8">
            Session started. Introduce yourself and ask how you can help.
          </Text>
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.id;
          return (
            <View className={`mb-3 flex-row ${isMine ? "justify-end" : "justify-start"}`}>
              <View
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                  isMine ? "bg-red-500 rounded-br-sm" : "bg-neutral-100 rounded-bl-sm"
                }`}
              >
                <Text className={`text-sm ${isMine ? "text-white" : "text-neutral-900"}`}>
                  {item.content}
                </Text>
                <Text className={`text-xs mt-1 ${isMine ? "text-red-200" : "text-neutral-400"}`}>
                  {new Date(item.sentAt).toLocaleTimeString("en-NG", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View className="flex-row items-end gap-2 px-4 py-3 border-t border-neutral-100">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
          className="flex-1 bg-neutral-100 rounded-2xl px-4 py-3 text-sm text-neutral-900"
          style={{ maxHeight: 100 }}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!text.trim()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            text.trim() ? "bg-red-500" : "bg-neutral-200"
          }`}
        >
          <Text className="text-white text-base">↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
