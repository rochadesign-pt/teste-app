import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Goal } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { ProgressBar } from "./ProgressBar";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function lighten(hex: string, a = 0.55) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * a);
  return `#${((1 << 24) + (mix(r) << 16) + (mix(g) << 8) + mix(b)).toString(16).slice(1)}`;
}

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
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[tint(color, 0.22), tint(color, 0.05)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: tint(color, 0.35) }]}
      >
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: tint(color, 0.9) }]}>
            <Text style={{ fontSize: 16 }}>{goal.icon ?? "🎯"}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {goal.name}
          </Text>
        </View>
        <Text style={styles.saved}>{formatMoney(goal.saved)}</Text>
        <Text style={styles.target}>de {formatMoney(goal.target)}</Text>
        <View style={styles.barWrap}>
          <ProgressBar progress={pct} from={lighten(color)} to={color} height={7} />
        </View>
        <View style={styles.foot}>
          <Text style={styles.footTxt}>{Math.round(pct * 100)}%</Text>
          <Text style={styles.footTxt}>
            {left <= 0 ? "concluído 🎉" : `faltam ${formatMoney(left)}`}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 210,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: "hidden",
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
  barWrap: { marginTop: spacing.md },
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  footTxt: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans },
});
