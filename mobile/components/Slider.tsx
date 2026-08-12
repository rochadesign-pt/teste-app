import { useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/theme";

const KNOB = 26;

/**
 * Slider arrastável (manual). Funciona na web via PanResponder: usa a
 * posição do toque no arranque (locationX, relativa à pista) somada ao
 * deslocamento do gesto (dx) — robusto mesmo dentro de um ScrollView.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  from = "#5EE7D0",
  to = colors.accents.teal,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  from?: string;
  to?: string;
}) {
  const [w, setW] = useState(0);
  const wRef = useRef(0);
  const grantX = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const scale = useRef(new Animated.Value(1)).current;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const snap = (v: number) => {
    const s = Math.round((v - min) / step) * step + min;
    return clamp(Number(s.toFixed(6)));
  };
  const fromX = (x: number) => {
    const width = wRef.current || 1;
    const ratio = Math.min(1, Math.max(0, x / width));
    return snap(min + ratio * (max - min));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    wRef.current = width;
    setW(width);
  };

  const spring = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        grantX.current = e.nativeEvent.locationX;
        spring(1.18);
        onChangeRef.current(fromX(grantX.current));
      },
      onPanResponderMove: (_e, g) => {
        onChangeRef.current(fromX(grantX.current + g.dx));
      },
      onPanResponderRelease: () => spring(1),
      onPanResponderTerminate: () => spring(1),
    }),
  ).current;

  const pct = max > min ? (clamp(value) - min) / (max - min) : 0;
  const fillW = Math.max(0, Math.min(w, pct * w));
  const knobLeft = Math.max(0, Math.min(w - KNOB, pct * w - KNOB / 2));

  return (
    <View style={styles.wrap} onLayout={onLayout} {...pan.panHandlers}>
      <View style={styles.track} />
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: fillW }]}
      />
      <Animated.View
        style={[
          styles.knob,
          { left: knobLeft, transform: [{ scale }], shadowColor: to },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 40, justifyContent: "center", position: "relative" },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    top: 17,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 6,
    top: 17,
    borderRadius: 999,
  },
  knob: {
    position: "absolute",
    top: 7,
    width: KNOB,
    height: KNOB,
    borderRadius: 999,
    backgroundColor: "#fff",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
