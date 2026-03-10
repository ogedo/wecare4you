import { Tabs } from "expo-router";
import { LayoutList, User } from "lucide-react-native";

export default function CounselorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ef4444",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { borderTopColor: "#e5e7eb" },
      }}
    >
      <Tabs.Screen
        name="queue"
        options={{
          title: "Crisis Queue",
          tabBarIcon: ({ color, size }) => <LayoutList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null, // Hidden from tab bar — navigated to programmatically
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
