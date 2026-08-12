import { StyleSheet, Text, View } from "react-native";
import { Ring } from "./charts";
import { CategoryGlyph } from "./CategoryGlyph";
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

const BADGE = 58;
const DISC = 42;

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function CategoryCard({ data }: { data: CategoryCardData }) {
  const { name, icon, color, spent, budget, currency } = data;
  const hasBudget = !!budget && budget > 0;
  const pct = hasBudget ? spent / (budget as number) : 1;
  const over = hasBudget && spent > (budget as number);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        {/* Badge: anel de progresso + disco na cor + ícone de linha */}
        <View style={styles.badge}>
          <Ring
            size={BADGE}
            stroke={5}
            progress={Math.min(1, pct)}
            color={over ? colors.danger : color}
            track={tint(over ? colors.danger : color, 0.2)}
            glow={false}
          />
          <View style={[styles.disc, { backgroundColor: color }]}>
            <CategoryGlyph icon={icon} size={24} color="#0A0A0B" />
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <View>
        <Text style={styles.spent} numberOfLines={1}>
          {formatMoney(spent, currency)}
        </Text>
        <Text style={[styles.budget, over && { color: colors.danger }]}>
          {hasBudget ? `/ ${formatMoney(budget as number, currency)}` : "sem orçamento"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 153,
    height: 184,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  top: { gap: 12 },
  badge: { width: BADGE, height: BADGE },
  disc: {
    position: "absolute",
    top: (BADGE - DISC) / 2,
    left: (BADGE - DISC) / 2,
    width: DISC,
    height: DISC,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
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
