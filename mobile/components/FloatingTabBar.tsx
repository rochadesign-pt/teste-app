import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Home07Icon from "@hugeicons/core-free-icons/Home07Icon";
import Exchange01Icon from "@hugeicons/core-free-icons/Exchange01Icon";
import ChartIncreaseIcon from "@hugeicons/core-free-icons/ChartIncreaseIcon";
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { colors, fonts } from "@/constants/theme";

const ICONS: Record<string, unknown> = {
  index: Home07Icon,
  transacoes: Exchange01Icon,
  investir: ChartIncreaseIcon,
  ferias: Beach02Icon,
  conta: UserIcon,
};

// Rótulo curto por tab (mantém a barra compacta com 5 separadores).
const LABELS: Record<string, string> = {
  index: "Início",
  transacoes: "Gastos",
  investir: "Investir",
  ferias: "Férias",
  conta: "Conta",
};

/**
 * Tab bar flutuante ao estilo do GitHub mobile: pílula branca destacada das
 * margens, cada separador com ícone + rótulo e o ativo realçado numa cápsula
 * de acento.
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
          const label = LABELS[route.name] ?? route.name;
          const color = focused ? colors.primary : colors.textMuted;
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
              hitSlop={8}
            >
              <View style={[styles.pill, focused && styles.pillActive]}>
                <HugeiconsIcon
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  icon={icon as any}
                  size={22}
                  color={color}
                  strokeWidth={2}
                />
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {label}
                </Text>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(14,15,19,0.06)",
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
  item: { alignItems: "center", justifyContent: "center" },
  pill: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  pillActive: { backgroundColor: "rgba(47,107,246,0.12)" },
  label: {
    fontSize: 10.5,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.1,
  },
});
