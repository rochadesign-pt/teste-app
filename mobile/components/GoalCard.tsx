import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Goal } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { CategoryGlyph } from "./CategoryGlyph";
import { ProgressBar } from "./ProgressBar";
import { colors, fonts, shadow } from "@/constants/theme";

function lighten(hex: string, a = 0.5) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * a);
  return `#${((1 << 24) + (mix((n >> 16) & 255) << 16) + (mix((n >> 8) & 255) << 8) + mix(n & 255)).toString(16).slice(1)}`;
}
function iconColorFor(hex: string) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#0A0A0B" : "#FFFFFF";
}

export function GoalCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const color = goal.color || colors.primary;
  const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  const left = Math.max(0, goal.target - goal.saved);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: color }]}>
          <CategoryGlyph icon={goal.icon} size={20} color={iconColorFor(color)} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {goal.name}
        </Text>
      </View>

      <Text style={styles.saved} numberOfLines={1}>
        {formatMoney(goal.saved)}
      </Text>
      <Text style={styles.target}>de {formatMoney(goal.target)}</Text>

      <View style={styles.bar}>
        <ProgressBar progress={pct} from={lighten(color)} to={color} height={7} />
      </View>

      <View style={styles.foot}>
        <Text style={styles.footTxt}>{Math.round(pct * 100)}%</Text>
        <Text style={styles.footTxt}>
          {left <= 0 ? "concluído 🎉" : `faltam ${formatMoney(left)}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 210,
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.2,
  },
  saved: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.6,
    marginTop: 14,
  },
  target: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  bar: { marginTop: 14 },
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  footTxt: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans },
});
