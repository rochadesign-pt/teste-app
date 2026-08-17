import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="transacoes" options={{ title: "Transações" }} />
      <Tabs.Screen name="investir" options={{ title: "Investir" }} />
      <Tabs.Screen name="ferias" options={{ title: "Férias" }} />
      <Tabs.Screen name="conta" options={{ title: "Conta" }} />
    </Tabs>
  );
}
