import { StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Barra de progresso com preenchimento em gradiente e brilho (glow) na web.
 * `from`/`to` definem o gradiente; se só passares `to`, o `from` clareia-o.
 */
export function ProgressBar({
  progress,
  from,
  to,
  height = 8,
  track = "rgba(255,255,255,0.12)",
}: {
  progress: number;
  from?: string;
  to: string;
  height?: number;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(1, progress));
  const glow = { filter: `drop-shadow(0 0 6px ${to}aa)` } as unknown as ViewStyle;
  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: track }]}>
      <LinearGradient
        colors={[from ?? to, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          { width: `${pct * 100}%`, height, borderRadius: height },
          pct > 0 ? glow : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", justifyContent: "center" },
});
