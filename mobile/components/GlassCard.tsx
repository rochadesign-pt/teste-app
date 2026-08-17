import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius as R, shadow } from "@/constants/theme";

/**
 * Cartão base (tema claro): superfície branca, cantos suaves e sombra
 * difusa. Mantém a API antiga (`fill`/`sheen` são ignorados) para não
 * partir os ecrãs que ainda a usam.
 */
export function GlassCard({
  children,
  style,
  contentStyle,
  r = R.lg,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  r?: number;
  sheen?: number;
  fill?: [string, string];
}) {
  return (
    <View
      style={[
        {
          borderRadius: r,
          backgroundColor: colors.surface,
          overflow: "hidden",
          ...shadow.card,
        },
        style,
      ]}
    >
      <View style={[{ borderRadius: r }, contentStyle]}>{children}</View>
    </View>
  );
}
