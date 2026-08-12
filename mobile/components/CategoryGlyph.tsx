import { Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { resolveHugeicon, keyForIcon } from "@/lib/hugeicons";

// Reexporta para quem inicializa o seletor a partir de um ícone guardado.
export { keyForIcon } from "@/lib/hugeicons";

/**
 * Ícone de categoria: desenha o ícone Hugeicons (linha, stroke 2) que
 * corresponde ao valor guardado (key nova, ou emoji/nome antigo). Se não
 * houver correspondência, mostra o texto/emoji.
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
  const huge = resolveHugeicon(icon);
  if (huge) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <HugeiconsIcon icon={huge as any} size={size} color={color} strokeWidth={2} />;
  }
  return (
    <Text style={{ fontSize: size * 0.86, color }}>{(icon ?? "").trim() || "💸"}</Text>
  );
}

// Mantém compatibilidade com quem importava ioniconFor (agora → keyForIcon).
export const ioniconFor = keyForIcon;
