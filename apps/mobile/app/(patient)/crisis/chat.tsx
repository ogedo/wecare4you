import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Linking, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { io, type Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const NIGERIAN_HOTLINES = [
  { name: "SPIG Crisis Line", number: "08002000", display: "0800-2000" },
  { name: "MANI Helpline", number: "+2348062106493", display: "+234 806 210 6493" },
  { name: "Mentally Aware NG", number: "+2348062106493", display: "+234 806 210 6493" },
];

interface CrisisMessage {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
}

type Stage = "connecting" | "waiting" | "active" | "fallback" | "ended";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function CrisisChatScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [stage, setStage] = useState<Stage>("connecting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CrisisMessage[]>([]);
  const [text, setText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Create session and connect socket
  useEffect(() => {
    let mounted = true;

    async function startSession() {
      try {
        const res = await api.post("/crisis/sessions");
        const session = res.data.data;
        if (!mounted) return;

        setSessionId(session.id);

        // If already active (re-joining existing session)
        if (session.status === "ACTIVE") {
          setStage("active");
          loadMessages(session.id);
        } else {
          setStage("waiting");
          // 60-second timeout fallback
          timeoutRef.current = setTimeout(() => {
            if (mounted) setStage("fallback");
          }, 60000);
        }

        // Connect socket
        const socket = io(API_URL, { auth: { token: accessToken } });
        socketRef.current = socket;

        socket.emit("join:crisis", session.id);

        socket.on("crisis:accepted", () => {
          if (mounted) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setStage("active");
            loadMessages(session.id);
          }
        });

        socket.on("crisis:message:new", (msg: CrisisMessage) => {
          if (mounted) {
            setMessages((prev) => [...prev, msg]);
          }
        });

        socket.on("crisis:ended", () => {
          if (mounted) setStage("ended");
        });
      } catch {
        if (mounted) setStage("fallback");
      }
    }

    startSession();

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socketRef.current?.disconnect();
    };
  }, [accessToken]);

  async function loadMessages(sid: string) {
    try {
      const res = await api.get(`/crisis/sessions/${sid}/messages`);
      setMessages(res.data.data ?? []);
    } catch {
      // best-effort
    }
  }

  async function endSession() {
    Alert.alert("End session", "Are you sure you want to end this crisis session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: async () => {
          if (sessionId) {
            await api.post(`/crisis/sessions/${sessionId}/end`).catch(() => {});
          }
          socketRef.current?.disconnect();
          router.back();
        },
      },
    ]);
  }

  function sendMessage() {
    if (!text.trim() || !sessionId || !socketRef.current) return;
    const content = text.trim();
    setText("");
    socketRef.current.emit("crisis:message:send", { sessionId, content });
  }

  // Connecting state
  if (stage === "connecting") {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="text-neutral-600 mt-4 text-center">Connecting to crisis support...</Text>
      </View>
    );
  }

  // Waiting for counselor
  if (stage === "waiting") {
    return (
      <View className="flex-1 bg-white px-8">
        <View className="pt-14 pb-4 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-neutral-900">Crisis Support</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-neutral-400 text-sm">Close</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-6">🆘</Text>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text className="text-lg font-semibold text-neutral-900 mt-6 text-center">
            Connecting you to a crisis counselor
          </Text>
          <Text className="text-neutral-500 text-sm mt-2 text-center">
            Please stay on this screen. A trained counselor will join shortly.
          </Text>
          <Text className="text-neutral-400 text-xs mt-8 text-center">
            You are not alone. Help is on the way.
          </Text>
        </View>
      </View>
    );
  }

  // Fallback: no counselor available
  if (stage === "fallback") {
    return (
      <View className="flex-1 bg-white px-8">
        <View className="pt-14 pb-4 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-neutral-900">Crisis Support</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-neutral-400 text-sm">Close</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1">
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 mt-4">
            <Text className="text-red-700 font-semibold">No counselors available right now</Text>
            <Text className="text-red-600 text-sm mt-1">
              Please call one of these emergency lines immediately:
            </Text>
          </View>

          {NIGERIAN_HOTLINES.map((line) => (
            <TouchableOpacity
              key={line.number}
              onPress={() => Linking.openURL(`tel:${line.number}`)}
              className="bg-white border border-neutral-200 rounded-2xl p-4 mb-3 flex-row items-center justify-between"
            >
              <View>
                <Text className="font-semibold text-neutral-900">{line.name}</Text>
                <Text className="text-neutral-500 text-sm mt-0.5">{line.display}</Text>
              </View>
              <View className="bg-red-500 rounded-xl px-3 py-1.5">
                <Text className="text-white text-sm font-semibold">Call Now</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text className="text-center text-neutral-400 text-xs mt-6">
            You can also keep waiting — a counselor may become available soon.
          </Text>
        </View>
      </View>
    );
  }

  // Session ended
  if (stage === "ended") {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-5xl mb-6">✅</Text>
        <Text className="text-xl font-bold text-neutral-900 text-center">Session Ended</Text>
        <Text className="text-neutral-500 text-center mt-2 mb-8">
          Thank you for reaching out. You are not alone.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-500 rounded-2xl px-8 py-3"
        >
          <Text className="text-white font-semibold">Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Active chat
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View className="pt-14 pb-3 px-4 bg-red-500 flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold text-base">Crisis Support</Text>
          <Text className="text-red-100 text-xs mt-0.5">Connected — you are safe</Text>
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
            A counselor has joined. Say hello — they're here to help.
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
                  {new Date(item.sentAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
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
