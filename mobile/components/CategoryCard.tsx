import { StyleSheet, Text, View } from "react-native";
import { Ring } from "./charts";
import { GlassCard } from "./GlassCard";
import { colors, fonts, spacing } from "@/constants/theme";
import { formatMoney } from "@/lib/format";

export type CategoryCardData = {
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget?: number;
  currency?: string;
};

function tint(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function CategoryCard({ data }: { data: CategoryCardData }) {
  const { name, icon, color, spent, budget, currency } = data;
  const progress = budget && budget > 0 ? spent / budget : 1;
  const remaining = budget ? budget - spent : undefined;
  const over = remaining !== undefined && remaining < 0;

  return (
    <GlassCard style={styles.card} contentStyle={styles.cardInner}>
      <View style={styles.ringWrap}>
        <Ring size={58} stroke={4} progress={progress} color={color} />
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: color, shadowColor: color },
          ]}
        >
          <Text style={styles.iconGlyph}>{icon}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.spent}>{formatMoney(spent, currency)}</Text>
      {remaining !== undefined ? (
        <Text style={[styles.sub, over && { color: colors.danger }]}>
          {over
            ? `${formatMoney(Math.abs(remaining), currency)} acima`
            : `${formatMoney(remaining, currency)} restantes`}
        </Text>
      ) : (
        <Text style={styles.sub}>sem orçamento</Text>
      )}
    </GlassCard>
  );
}

const RING = 58;
const styles = StyleSheet.create({
  card: { width: 156 },
  cardInner: { padding: spacing.md, gap: spacing.sm },
  ringWrap: { width: RING, height: RING },
  iconCircle: {
    position: "absolute",
    top: 10,
    left: 10,
    width: RING - 20,
    height: RING - 20,
    borderRadius: RING,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.55,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  iconGlyph: { fontSize: 18 },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: fonts.sans,
    marginTop: spacing.xs,
  },
  spent: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
  },
  sub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
});
