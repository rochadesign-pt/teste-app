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
      <Stack.Screen name="index" options={{ title: "As minhas despesas" }} />
      <Stack.Screen
        name="new"
        options={{ title: "Nova despesa", presentation: "modal" }}
      />
    </Stack>
  );
}
