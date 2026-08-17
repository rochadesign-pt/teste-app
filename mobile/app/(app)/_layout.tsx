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
      <Stack.Screen
        name="sub-form"
        options={{ title: "Recorrência", presentation: "modal" }}
      />
      <Stack.Screen
        name="investimento-form"
        options={{ title: "Investimento", presentation: "modal" }}
      />
      <Stack.Screen
        name="rendimento"
        options={{ title: "Rendimento", presentation: "modal" }}
      />
      <Stack.Screen name="categorias" options={{ title: "Categorias" }} />
      <Stack.Screen
        name="categoria-form"
        options={{ title: "Categoria", presentation: "modal" }}
      />
      <Stack.Screen name="grupo" options={{ title: "Viagem" }} />
      <Stack.Screen
        name="grupo-form"
        options={{ title: "Nova viagem", presentation: "modal" }}
      />
      <Stack.Screen
        name="grupo-despesa"
        options={{ title: "Despesa", presentation: "modal" }}
      />
    </Stack>
  );
}
