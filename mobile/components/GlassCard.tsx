import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius as R } from "@/constants/theme";

/**
 * Cartão "janota": um contorno de 1px feito de gradiente (luz a bater no
 * topo-esquerdo, a esbater) por cima de uma superfície escura com leve
 * profundidade vertical. Dá o efeito glassy/brilho das referências.
 */
export function GlassCard({
  children,
  style,
  contentStyle,
  r = R.lg,
  sheen = 0.16,
  fill = ["#1B1B20", "#131315"],
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  r?: number;
  sheen?: number;
  fill?: [string, string];
}) {
  return (
    <LinearGradient
      colors={[
        `rgba(255,255,255,${sheen})`,
        "rgba(255,255,255,0.02)",
        "rgba(255,255,255,0.07)",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: r, padding: 1 }, style]}
    >
      <LinearGradient
        colors={fill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[{ borderRadius: r - 1, overflow: "hidden" }, contentStyle]}
      >
        {children}
      </LinearGradient>
    </LinearGradient>
  );
}
