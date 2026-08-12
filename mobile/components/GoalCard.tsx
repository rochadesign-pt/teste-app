import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Goal } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { IconBadge } from "./IconBadge";
import { cardShell } from "./cardShell";
import { colors, fonts } from "@/constants/theme";

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
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <IconBadge color={color} icon={goal.icon} progress={pct} size={58} />
        <Text style={styles.name} numberOfLines={1}>
          {goal.name}
        </Text>
      </View>

      <View>
        <Text style={styles.saved} numberOfLines={1}>
          {formatMoney(goal.saved)}
        </Text>
        <Text style={styles.target} numberOfLines={1}>
          {left <= 0 ? "concluído 🎉" : `/ ${formatMoney(goal.target)}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardShell,
    width: 176,
    height: 184,
    justifyContent: "space-between",
  },
  top: { gap: 12 },
  name: {
    color: "#F5F5F7",
    fontSize: 14,
    fontFamily: fonts.sans,
    letterSpacing: -0.21,
  },
  saved: {
    color: "#F5F5F7",
    fontSize: 18,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.72,
  },
  target: {
    color: "rgba(245,245,247,0.6)",
    fontSize: 18,
    fontFamily: fonts.sans,
    letterSpacing: -0.72,
    marginTop: 2,
  },
});
