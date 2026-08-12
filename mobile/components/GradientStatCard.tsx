import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius as R } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Desfoque só existe na web (react-native-web suporta `filter`).
const BLUR = { filter: "blur(30px)" } as unknown as ViewStyle;

/**
 * Cartão de estatística com preenchimento em gradiente da sua cor + brilho
 * no canto (estilo widgets de fitness). Cada cartão ganha carácter próprio
 * pela cor, mantendo o texto legível sobre a base escura.
 */
export function GradientStatCard({
  color,
  children,
  style,
  contentStyle,
  r = R.lg,
}: {
  color: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  r?: number;
}) {
  return (
    <View
      style={[
        styles.card,
        { borderRadius: r, borderColor: tint(color, 0.3) },
        style,
      ]}
    >
      <LinearGradient
        colors={[tint(color, 0.34), tint(color, 0.1), "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[styles.glow, { backgroundColor: tint(color, 0.5) }, BLUR]}
        pointerEvents="none"
      />
      {/* Realce glassy no topo */}
      <LinearGradient
        colors={["rgba(255,255,255,0.14)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#0F0F12",
  },
  glow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    bottom: -46,
    right: -34,
  },
});
