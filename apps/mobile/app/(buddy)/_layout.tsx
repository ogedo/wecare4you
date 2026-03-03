import { Tabs } from "expo-router";
import { Home, Calendar, DollarSign } from "lucide-react-native";

export default function BuddyLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2a9d7f",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="sessions" options={{ title: "Sessions", tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }} />
      <Tabs.Screen name="earnings" options={{ title: "Earnings", tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} /> }} />
    </Tabs>
  );
}
