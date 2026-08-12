import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Ícone de categoria. Se `icon` for o nome de um ícone Ionicons (linha),
 * desenha-o; caso contrário mostra-o como emoji (retrocompatível com
 * categorias antigas que guardavam emojis).
 */
export function CategoryGlyph({
  icon,
  size,
  color,
}: {
  icon?: string;
  size: number;
  color: string;
}) {
  const name = (icon ?? "").trim();
  const isIonicon =
    /^[a-z0-9-]+$/.test(name) && name in (Ionicons.glyphMap as object);
  if (isIonicon) {
    return <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
  }
  return <Text style={{ fontSize: size * 0.86, color }}>{name || "💸"}</Text>;
}
