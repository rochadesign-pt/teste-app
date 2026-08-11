import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Goal } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function GoalCard({
  goal,
  onPress,
}: {
  goal: Goal;
  onPress: () => void;
}) {
  const color = goal.color || colors.primary;
  const pct = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  const left = Math.max(0, goal.target - goal.saved);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: tint(color, 0.16) }]}>
          <Text style={{ fontSize: 16 }}>{goal.icon ?? "🎯"}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {goal.name}
        </Text>
      </View>
      <Text style={styles.saved}>{formatMoney(goal.saved)}</Text>
      <Text style={styles.target}>de {formatMoney(goal.target)}</Text>
      <View style={styles.bar}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: color },
          ]}
        />
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 9 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: fonts.sans,
    flex: 1,
  },
  saved: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  target: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  bar: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  fill: { height: 7, borderRadius: 999 },
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  footTxt: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans },
});
