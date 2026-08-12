import { StyleSheet, View } from "react-native";
import { Ring } from "./charts";
import { CategoryGlyph } from "./CategoryGlyph";
import { colors } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Ícone escuro em discos claros (amarelo/laranja), branco em discos
// escuros/saturados (verde/vermelho/azul) — sempre com bom contraste.
function iconColorFor(hex: string) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#0A0A0B" : "#FFFFFF";
}

/**
 * Badge de ícone uniforme: anel de progresso + disco na cor + ícone de
 * linha ao centro. Base visual comum a categorias, objetivos e
 * investimentos.
 */
export function IconBadge({
  color,
  icon,
  progress = 1,
  size = 58,
  over = false,
}: {
  color: string;
  icon?: string;
  progress?: number;
  size?: number;
  over?: boolean;
}) {
  const disc = Math.round(size * 0.724);
  const ringColor = over ? colors.danger : color;
  return (
    <View style={{ width: size, height: size }}>
      <Ring
        size={size}
        stroke={Math.max(4, Math.round(size * 0.086))}
        progress={Math.max(0, Math.min(1, progress))}
        color={ringColor}
        track={tint(ringColor, 0.2)}
        glow={false}
      />
      <View
        style={[
          styles.disc,
          {
            top: (size - disc) / 2,
            left: (size - disc) / 2,
            width: disc,
            height: disc,
            backgroundColor: color,
          },
        ]}
      >
        <CategoryGlyph icon={icon} size={Math.round(disc * 0.57)} color={iconColorFor(color)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    position: "absolute",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
