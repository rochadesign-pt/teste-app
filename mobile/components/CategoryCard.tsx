import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Rect } from "react-native-svg";
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

const BADGE = 88;
const R = 41;

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Disco que enche de baixo para cima consoante a percentagem gasta.
function FillBadge({
  fill,
  color,
  over,
}: {
  fill: number;
  color: string;
  over: boolean;
}) {
  const f = Math.max(0, Math.min(1, fill));
  const fillY = BADGE - f * BADGE;
  return (
    <Svg width={BADGE} height={BADGE}>
      <Defs>
        <ClipPath id="catclip">
          <Circle cx={BADGE / 2} cy={BADGE / 2} r={R} />
        </ClipPath>
      </Defs>
      {/* fundo (parte por gastar) */}
      <Circle cx={BADGE / 2} cy={BADGE / 2} r={R} fill={tint(color, 0.16)} />
      {/* nível gasto */}
      <G clipPath="url(#catclip)">
        <Rect x={0} y={fillY} width={BADGE} height={BADGE} fill={color} />
      </G>
      {/* contorno */}
      <Circle
        cx={BADGE / 2}
        cy={BADGE / 2}
        r={R}
        stroke={over ? colors.danger : color}
        strokeWidth={3}
        fill="none"
      />
    </Svg>
  );
}

export function CategoryCard({ data }: { data: CategoryCardData }) {
  const { name, icon, color, spent, budget, currency } = data;
  const hasBudget = !!budget && budget > 0;
  const pct = hasBudget ? spent / (budget as number) : 1;
  const over = hasBudget && spent > (budget as number);

  return (
    <GlassCard style={styles.card} contentStyle={styles.inner}>
      <View style={styles.badge}>
        <FillBadge fill={pct} color={color} over={over} />
        <View style={styles.iconWrap} pointerEvents="none">
          <Text style={styles.emoji}>{icon}</Text>
        </View>
        {hasBudget && (
          <View style={styles.pctWrap} pointerEvents="none">
            <Text style={styles.pctTxt}>{Math.round(pct * 100)}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.spent} numberOfLines={1}>
        {formatMoney(spent, currency)}
      </Text>
      {hasBudget ? (
        <Text style={[styles.budget, over && { color: colors.danger }]}>
          / {formatMoney(budget as number, currency)}
        </Text>
      ) : (
        <Text style={styles.budget}>sem orçamento</Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { width: 176 },
  inner: { padding: spacing.lg },
  badge: { width: BADGE, height: BADGE, marginBottom: spacing.md },
  iconWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BADGE,
    height: BADGE,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 26,
    // sombra subtil para o emoji ler sobre a cor
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pctWrap: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pctTxt: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
  spent: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.6,
    marginTop: spacing.sm,
  },
  budget: {
    color: colors.textMuted,
    fontSize: 15,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
});
