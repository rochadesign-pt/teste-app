import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Animated, Easing } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * Entrada suave: aparece (fade) e sobe ligeiramente ao montar. Usa `delay`
 * para escalonar vários elementos em sequência. Anima uma vez, ao montar.
 */
export function FadeInUp({
  children,
  delay = 0,
  distance = 14,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: 440,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            {
              translateY: t.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
