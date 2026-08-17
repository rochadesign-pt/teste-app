import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Home07Icon from "@hugeicons/core-free-icons/Home07Icon";
import Exchange01Icon from "@hugeicons/core-free-icons/Exchange01Icon";
import ChartIncreaseIcon from "@hugeicons/core-free-icons/ChartIncreaseIcon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { colors } from "@/constants/theme";

const ICONS: Record<string, unknown> = {
  index: Home07Icon,
  transacoes: Exchange01Icon,
  investir: ChartIncreaseIcon,
  conta: UserIcon,
};

/**
 * "Gravitating" tab bar: pílula flutuante, destacada das margens, com o item
 * ativo elevado num círculo de acento que salta acima da barra.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 14) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const icon = ICONS[route.name] ?? Home07Icon;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.item}
              hitSlop={10}
            >
              <View style={[styles.icon, focused && styles.iconActive]}>
                <HugeiconsIcon
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  icon={icon as any}
                  size={24}
                  color={focused ? "#FFFFFF" : colors.textMuted}
                  strokeWidth={2}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 66,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(14,15,19,0.06)",
    // Sombra para "flutuar".
    shadowColor: "#0B1220",
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
    ...Platform.select({
      web: { backdropFilter: "blur(20px)" } as object,
      default: {},
    }),
  },
  item: {
    width: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: {
    backgroundColor: colors.ink,
  },
});
