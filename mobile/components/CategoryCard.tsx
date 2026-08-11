import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, radius, spacing } from "@/constants/theme";
import { formatMoney } from "@/lib/format";

export type CategoryCardData = {
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget?: number;
  currency?: string;
};

const RING = 58; // diâmetro do anel
const STROKE = 4;

function ProgressRing({
  progress,
  color,
  icon,
}: {
  progress: number;
  color: string;
  icon: string;
}) {
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(progress, 1));
  const offset = c * (1 - clamped);

  return (
    <View style={{ width: RING, height: RING }}>
      <Svg width={RING} height={RING}>
        {/* Track */}
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={colors.surfaceAlt}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progresso */}
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${RING / 2}, ${RING / 2}`}
        />
      </Svg>
      {/* Ícone no centro, sobre círculo cheio da cor */}
      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Text style={styles.iconGlyph}>{icon}</Text>
      </View>
    </View>
  );
}

export function CategoryCard({ data }: { data: CategoryCardData }) {
  const { name, icon, color, spent, budget, currency } = data;
  const progress = budget && budget > 0 ? spent / budget : 1;
  const remaining = budget ? budget - spent : undefined;
  const over = remaining !== undefined && remaining < 0;

  return (
    <View style={styles.card}>
      <ProgressRing progress={progress} color={color} icon={icon} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconCircle: {
    position: "absolute",
    top: STROKE + 5,
    left: STROKE + 5,
    width: RING - (STROKE + 5) * 2,
    height: RING - (STROKE + 5) * 2,
    borderRadius: RING,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: { fontSize: 18 },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  spent: { color: colors.text, fontSize: 20, fontWeight: "800" },
  sub: { color: colors.textMuted, fontSize: 13 },
});
