import { StyleSheet, Text, View } from "react-native";
import { IconBadge } from "./IconBadge";
import { cardShell } from "./cardShell";
import { colors, fonts } from "@/constants/theme";
import { formatMoney } from "@/lib/format";

export type CategoryCardData = {
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget?: number;
  currency?: string;
};

export function CategoryCard({ data }: { data: CategoryCardData }) {
  const { name, icon, color, spent, budget, currency } = data;
  const hasBudget = !!budget && budget > 0;
  const pct = hasBudget ? spent / (budget as number) : 1;
  const over = hasBudget && spent > (budget as number);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <IconBadge color={color} icon={icon} progress={pct} over={over} size={58} />
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <View>
        <Text style={styles.spent} numberOfLines={1}>
          {formatMoney(spent, currency)}
        </Text>
        <Text style={[styles.budget, over && { color: colors.danger }]}>
          {!hasBudget
            ? "sem limite"
            : over
              ? `${formatMoney(spent - (budget as number), currency)} acima`
              : `/ ${formatMoney((budget as number) - spent, currency)} livre`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardShell,
    width: 153,
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
  spent: {
    color: "#F5F5F7",
    fontSize: 18,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.72,
  },
  budget: {
    color: "rgba(245,245,247,0.6)",
    fontSize: 18,
    fontFamily: fonts.sans,
    letterSpacing: -0.72,
    marginTop: 2,
  },
});
