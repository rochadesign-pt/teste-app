import type { ViewStyle } from "react-native";
import { colors, shadow } from "@/constants/theme";

/**
 * Superfície de cartão uniforme (tema claro): fundo branco, cantos suaves,
 * sombra difusa. Espalhar com `...cardShell`.
 */
export const cardShell: ViewStyle = {
  borderRadius: 20,
  backgroundColor: colors.surface,
  padding: 16,
  overflow: "hidden",
  ...shadow.card,
};
