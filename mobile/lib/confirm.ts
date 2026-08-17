import { Alert, Platform } from "react-native";

/**
 * Confirmação de ação (ex.: apagar) que funciona na web E no nativo.
 *
 * Na web o `Alert.alert` do react-native-web com vários botões não abre um
 * diálogo funcional — o callback de "Apagar" nunca dispara. Por isso na web
 * usamos `window.confirm`; no nativo usamos o `Alert.alert` normal.
 */
export function confirmDelete(
  title: string,
  message?: string,
  confirmLabel = "Apagar",
): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.confirm) return Promise.resolve(false);
    return Promise.resolve(
      window.confirm(message ? `${title}\n\n${message}` : title),
    );
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
