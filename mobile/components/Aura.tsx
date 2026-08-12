import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Fundo atmosférico: duas "orbs" desfocadas (indigo + violeta) por trás do
 * topo do ecrã, com uma leve lavagem vertical. Dá a profundidade imersiva
 * das referências (Coinza / Proxima) sem pesar no conteúdo.
 */
export function Aura({
  height = 560,
  a = "rgba(163,230,53,0.22)",
  b = "rgba(132,204,22,0.14)",
  wash = "rgba(163,230,53,0.07)",
}: {
  height?: number;
  a?: string;
  b?: string;
  wash?: string;
}) {
  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <LinearGradient
        colors={[wash, "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[styles.orb, styles.orbA, { backgroundColor: a }, BLUR]}
      />
      <View
        style={[styles.orb, styles.orbB, { backgroundColor: b }, BLUR]}
      />
    </View>
  );
}

// Desfoque só existe na web (react-native-web suporta `filter`).
const BLUR = { filter: "blur(80px)" } as unknown as import("react-native").ViewStyle;

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0 },
  orb: { position: "absolute", borderRadius: 999 },
  orbA: { width: 340, height: 340, top: -140, left: -60 },
  orbB: { width: 300, height: 300, top: -50, right: -80 },
});
