import { Redirect } from "expo-router";

// Entrada da app. O guard em _layout.tsx trata de mandar para o login
// caso não haja sessão ativa.
export default function Index() {
  return <Redirect href="/(app)/(tabs)" />;
}
