import { Tabs, useRouter } from "expo-router";
import { Home, Calendar, MessageSquare, Settings } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { api } from "@/lib/api";

function NotificationBadge() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api
      .get("/notifications")
      .then((r) => {
        const notifs: { isRead: boolean }[] = r.data.data ?? [];
        setUnread(notifs.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  }, []);

  if (unread === 0) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -8,
        backgroundColor: "#ef4444",
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
        {unread > 9 ? "9+" : unread}
      </Text>
    </View>
  );
}

function SOSButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(patient)/crisis/chat")}
      style={{
        position: "absolute",
        bottom: 80,
        right: 16,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        zIndex: 999,
      }}
    >
      <Text style={{ fontSize: 22 }}>🆘</Text>
    </TouchableOpacity>
  );
}

export default function PatientLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2a9d7f",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: { borderTopColor: "#e5e7eb" },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="therapists"
          options={{
            title: "Find Support",
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: "Sessions",
            tabBarIcon: ({ color, size }) => (
              <View>
                <Calendar color={color} size={size} />
                <NotificationBadge />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="crisis"
          options={{ href: null }} // Hidden from tab bar
        />
      </Tabs>

      {/* Floating SOS button — visible on all tabs */}
      <SOSButton />
    </View>
  );
}
