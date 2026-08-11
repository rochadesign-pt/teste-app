import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="new"
        options={{ title: "Nova despesa", presentation: "modal" }}
      />
      <Stack.Screen
        name="goal"
        options={{ title: "Objetivo", presentation: "modal" }}
      />
      <Stack.Screen
        name="goal-form"
        options={{ title: "Objetivo", presentation: "modal" }}
      />
    </Stack>
  );
}
