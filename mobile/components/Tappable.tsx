import { useRef } from "react";
import type { ReactNode } from "react";
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Envolve conteúdo com uma micro-interação de toque: encolhe suavemente ao
 * premir e volta com um ligeiro ressalto. Mantém o layout no próprio
 * Pressable para não alterar o fluxo (flex, margens, etc.).
 */
export function Tappable({
  children,
  onPress,
  onLongPress,
  style,
  scaleTo = 0.97,
  hitSlop,
}: {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hitSlop?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      speed: 40,
      bounciness: 7,
    }).start();

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      hitSlop={hitSlop}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
