import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

const eur0 = (n: number) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

function num(v: string, fallback = 0) {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? fallback : n;
}

function NumInput({
  label,
  value,
  onChangeText,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

function computeInvestment(P: number, PMT: number, annual: number, years: number) {
  const yy = Math.max(1, Math.round(years));
  const r = annual / 100 / 12;
  const at = (m: number) =>
    r === 0 ? P + PMT * m : P * Math.pow(1 + r, m) + PMT * ((Math.pow(1 + r, m) - 1) / r);
  const n = Math.round(years * 12);
  const fv = at(n);
  const invested = P + PMT * n;
  const valSeries: number[] = [];
  const invSeries: number[] = [];
  for (let y = 0; y <= yy; y++) {
    valSeries.push(at(y * 12));
    invSeries.push(P + PMT * (y * 12));
  }
  return { fv, invested, earnings: fv - invested, valSeries, invSeries };
}

function GrowthChart({ val, inv }: { val: number[]; inv: number[] }) {
  const w = 320;
  const h = 120;
  const pad = 8;
  const max = Math.max(...val, 1);
  const X = (i: number) => (val.length === 1 ? 0 : (i / (val.length - 1)) * w);
  const Y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const path = (a: number[]) =>
    a.map((v, i) => `${i ? "L" : "M"} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const vl = path(val);
  const va = `${vl} L ${w} ${h} L 0 ${h} Z`;
  const il = path(inv);
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.accents.teal} stopOpacity={0.3} />
          <Stop offset="1" stopColor={colors.accents.teal} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={va} fill="url(#ig)" />
      <Path d={il} stroke={colors.textMuted} strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
      <Path d={vl} stroke={colors.accents.teal} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function yearsToFire(target: number, current: number, monthly: number, rate: number) {
  if (current >= target) return 0;
  const r = rate / 100 / 12;
  let bal = current;
  let m = 0;
  while (bal < target && m < 80 * 12) {
    bal = bal * (1 + r) + monthly;
    m++;
  }
  return m >= 80 * 12 ? null : m / 12;
}

export default function Investir() {
  // Simulador
  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState("150");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("10");

  const sim = useMemo(
    () => computeInvestment(num(initial), num(monthly), num(rate), Math.max(1, num(years, 1))),
    [initial, monthly, rate, years],
  );

  // FIRE
  const [spend, setSpend] = useState("1500");
  const [withdraw, setWithdraw] = useState("4");
  const [current, setCurrent] = useState("15000");
  const [fMonthly, setFMonthly] = useState("400");
  const [fRate, setFRate] = useState("7");

  const fire = useMemo(() => {
    const target = (num(spend) * 12) / (Math.max(0.1, num(withdraw)) / 100);
    const y = yearsToFire(target, num(current), num(fMonthly), num(fRate));
    return { target, income: target * (num(withdraw) / 100), years: y };
  }, [spend, withdraw, current, fMonthly, fRate]);

  const fireYears =
    fire.years === null
      ? "80+ anos"
      : fire.years <= 0
        ? "já és! 🎉"
        : fire.years < 1
          ? `~${Math.round(fire.years * 12)} meses`
          : `~${fire.years.toFixed(fire.years < 10 ? 1 : 0)} anos`;
  const fireProgress = Math.min(1, num(current) / (fire.target || 1));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Investir</Text>

        {/* Simulador */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Simulador de investimento</Text>
          <Text style={styles.cardSub}>Vê quanto rende com juros compostos.</Text>
          <View style={styles.grid}>
            <NumInput label="Capital inicial" value={initial} onChangeText={setInitial} unit="€" />
            <NumInput label="Reforço mensal" value={monthly} onChangeText={setMonthly} unit="€" />
            <NumInput label="Taxa de retorno anual" value={rate} onChangeText={setRate} unit="%" />
            <NumInput label="Prazo" value={years} onChangeText={setYears} unit="anos" />
          </View>

          <View style={styles.result}>
            <Text style={styles.resultLabel}>
              Valor estimado ao fim de {Math.max(1, Math.round(num(years, 1)))} anos
            </Text>
            <Text style={styles.resultBig}>{formatMoney(sim.fv)}</Text>
            <GrowthChart val={sim.valSeries} inv={sim.invSeries} />
            <View style={styles.legend}>
              <Text style={styles.legendItem}>
                <Text style={{ color: colors.accents.teal }}>■</Text> Valor total
              </Text>
              <Text style={styles.legendItem}>
                <Text style={{ color: colors.textMuted }}>■</Text> Investido
              </Text>
            </View>
            <View style={styles.split}>
              <View>
                <Text style={styles.splitK}>Total investido</Text>
                <Text style={styles.splitV}>{formatMoney(sim.invested)}</Text>
              </View>
              <View>
                <Text style={styles.splitK}>Ganhos (juros)</Text>
                <Text style={[styles.splitV, { color: colors.accents.teal }]}>
                  + {formatMoney(sim.earnings)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FIRE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Liberdade financeira 🔥</Text>
          <Text style={styles.cardSub}>Quanto precisas para viver dos juros.</Text>
          <View style={styles.grid}>
            <NumInput label="Gasto mensal desejado" value={spend} onChangeText={setSpend} unit="€" />
            <NumInput label="Taxa de levantamento" value={withdraw} onChangeText={setWithdraw} unit="%" />
            <NumInput label="Património atual" value={current} onChangeText={setCurrent} unit="€" />
            <NumInput label="Reforço mensal" value={fMonthly} onChangeText={setFMonthly} unit="€" />
          </View>
          <NumInput label="Retorno anual esperado" value={fRate} onChangeText={setFRate} unit="%" />

          <View style={styles.result}>
            <Text style={styles.resultLabel}>Precisas de ter investido</Text>
            <Text style={styles.resultBig}>{formatMoney(fire.target)}</Text>
            <Text style={styles.cardSub}>
              para gerar {formatMoney(fire.income)} por ano ({formatMoney(fire.income / 12)}/mês)
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${fireProgress * 100}%` },
                ]}
              />
            </View>
            <View style={styles.split}>
              <View>
                <Text style={styles.splitK}>Já tens</Text>
                <Text style={styles.splitV}>{formatMoney(num(current))}</Text>
              </View>
              <View>
                <Text style={styles.splitK}>Independente em</Text>
                <Text style={[styles.splitV, { color: colors.accents.orange }]}>
                  {fireYears}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  h1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.8,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: "600", fontFamily: fonts.sans },
  cardSub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  field: { flexGrow: 1, flexBasis: "45%", gap: 6 },
  fieldLabel: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans },
  inputWrap: { position: "relative", justifyContent: "center" },
  input: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.sans,
    paddingHorizontal: 12,
    paddingRight: 44,
  },
  unit: {
    position: "absolute",
    right: 12,
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.sans,
  },
  result: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  resultLabel: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  resultBig: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -1,
  },
  legend: { flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 4 },
  legendItem: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.sans },
  split: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  splitK: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans },
  splitV: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: fonts.sans,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.accents.orange,
  },
});
