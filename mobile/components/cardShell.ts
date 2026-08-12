import type { ViewStyle } from "react-native";

/**
 * Superfície de cartão uniforme (base do design): fundo translúcido,
 * contorno fino, cantos 19, padding 16. Espalhar com `...cardShell`.
 */
export const cardShell: ViewStyle = {
  borderRadius: 19,
  backgroundColor: "rgba(255,255,255,0.04)",
  borderWidth: 0.5,
  borderColor: "rgba(255,255,255,0.14)",
  padding: 16,
  overflow: "hidden",
};
