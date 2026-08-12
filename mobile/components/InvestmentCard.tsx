import { StyleSheet, Text, View } from "react-native";
import type { Investment } from "@/lib/api";
import { projectInvestment, formatNextDeposit } from "@/lib/invest";
import { formatMoney } from "@/lib/format";
import { IconBadge } from "./IconBadge";
import { cardShell } from "./cardShell";
import { Tappable } from "./Tappable";
import { Sparkline } from "./charts";
import { colors, fonts, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#35D6C5").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function InvestmentCard({
  inv,
  onPress,
}: {
  inv: Investment;
  onPress: () => void;
}) {
  const color = inv.color || colors.accents.teal;
  const p = projectInvestment(inv);
  return (
    <Tappable scaleTo={0.98} onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.head}>
          <IconBadge color={color} icon={inv.icon} progress={1} size={44} />
          <Text style={styles.name} numberOfLines={1}>
            {inv.name}
          </Text>
          {inv.monthlyDeposit > 0 && (
            <View style={[styles.chip, { backgroundColor: tint(color, 0.16) }]}>
              <Text style={[styles.chipTxt, { color }]}>
                {formatMoney(inv.monthlyDeposit)}/mês
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.value}>{formatMoney(p.value)}</Text>
        <Text style={styles.valueSub}>
          valor estimado hoje
          {p.months > 0 ? ` · ${p.months} ${p.months === 1 ? "mês" : "meses"}` : ""}
        </Text>

        <View style={styles.chartWrap}>
          <Sparkline
            values={p.series}
            width={300}
            height={56}
            from={tint(color, 0.9)}
            to={color}
          />
        </View>

        <View style={styles.foot}>
          <View style={styles.footCol}>
            <Text style={styles.footK}>Depositado</Text>
            <Text style={styles.footV}>{formatMoney(p.contributed)}</Text>
          </View>
          <View style={styles.footCol}>
            <Text style={styles.footK}>Ganhos</Text>
            <Text style={[styles.footV, { color: colors.success }]}>
              {p.growth >= 0 ? "+" : ""}
              {formatMoney(p.growth)}
            </Text>
          </View>
          <View style={[styles.footCol, { alignItems: "flex-end" }]}>
            <Text style={styles.footK}>Próximo</Text>
            <Text style={styles.footV}>{formatNextDeposit(p.nextDeposit)}</Text>
          </View>
        </View>
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  card: { ...cardShell, gap: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: {
    flex: 1,
    color: "#F5F5F7",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt: { fontSize: 12.5, fontWeight: "600", fontFamily: fonts.sans },
  value: {
    color: "#F5F5F7",
    fontSize: 28,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  valueSub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  chartWrap: { marginTop: spacing.sm, marginHorizontal: -4 },
  foot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  footCol: { gap: 2 },
  footK: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.sans },
  footV: {
    color: "#F5F5F7",
    fontSize: 14.5,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
});
