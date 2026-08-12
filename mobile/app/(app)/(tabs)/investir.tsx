import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient as ExpoGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { GlassCard } from "@/components/GlassCard";
import { InvestmentCard } from "@/components/InvestmentCard";
import { Slider } from "@/components/Slider";
import { ProgressBar } from "@/components/ProgressBar";
import { Aura } from "@/components/Aura";
import { api, type Investment } from "@/lib/api";
import { projectInvestment } from "@/lib/invest";
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
  const router = useRouter();

  // Investimentos reais (com depósitos recorrentes)
  const [investments, setInvestments] = useState<Investment[]>([]);
  useFocusEffect(
    useCallback(() => {
      api
        .listInvestments()
        .then(setInvestments)
        .catch(() => setInvestments([]));
    }, []),
  );
  const portfolio = useMemo(() => {
    let value = 0;
    let contributed = 0;
    let monthly = 0;
    for (const inv of investments) {
      const p = projectInvestment(inv);
      value += p.value;
      contributed += p.contributed;
      monthly += inv.monthlyDeposit || 0;
    }
    return { value, contributed, growth: value - contributed, monthly };
  }, [investments]);

  // Simulador (controlos manuais: slider + botões)
  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState(150);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);

  const sim = useMemo(
    () => computeInvestment(num(initial), monthly, rate, Math.max(1, years)),
    [initial, monthly, rate, years],
  );

  // FIRE (controlos manuais)
  const [spend, setSpend] = useState(1500);
  const [withdraw, setWithdraw] = useState(4);
  const [current, setCurrent] = useState("15000");
  const [fMonthly, setFMonthly] = useState(400);
  const [fRate, setFRate] = useState(7);

  const fire = useMemo(() => {
    const target = (spend * 12) / (Math.max(0.1, withdraw) / 100);
    const y = yearsToFire(target, num(current), fMonthly, fRate);
    return { target, income: target * (withdraw / 100), years: y };
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
      <Aura height={360} a="rgba(53,214,197,0.20)" b="rgba(99,102,241,0.20)" wash="rgba(53,214,197,0.07)" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Investir</Text>

        {/* Os meus investimentos */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Os meus investimentos</Text>
          <Pressable onPress={() => router.push("/(app)/investimento-form")}>
            <Text style={styles.secLink}>+ Novo</Text>
          </Pressable>
        </View>

        {investments.length > 0 ? (
          <>
            <GlassCard
              contentStyle={styles.portfolioInner}
              fill={["#15201F", "#111417"]}
              sheen={0.2}
            >
              <Text style={styles.portfolioLabel}>Valor total estimado</Text>
              <Text style={styles.portfolioValue}>{formatMoney(portfolio.value)}</Text>
              <View style={styles.portfolioRow}>
                <Text style={styles.portfolioSub}>
                  <Text style={{ color: colors.success }}>
                    {portfolio.growth >= 0 ? "+" : ""}
                    {formatMoney(portfolio.growth)}
                  </Text>{" "}
                  em ganhos
                </Text>
                {portfolio.monthly > 0 && (
                  <Text style={styles.portfolioSub}>
                    {formatMoney(portfolio.monthly)}/mês a entrar
                  </Text>
                )}
              </View>
            </GlassCard>
            <View style={{ gap: spacing.md }}>
              {investments.map((inv) => (
                <InvestmentCard
                  key={inv._id}
                  inv={inv}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/investimento-form",
                      params: {
                        id: inv._id,
                        name: inv.name,
                        initialValue: String(inv.initialValue),
                        monthlyDeposit: String(inv.monthlyDeposit),
                        annualRate: String(inv.annualRate),
                        startDate: inv.startDate ?? "",
                        icon: inv.icon ?? "",
                        color: inv.color ?? "",
                      },
                    })
                  }
                />
              ))}
            </View>
          </>
        ) : (
          <Pressable
            style={styles.empty}
            onPress={() => router.push("/(app)/investimento-form")}
          >
            <Text style={styles.emptyText}>
              + Adicionar um investimento com depósitos recorrentes
            </Text>
          </Pressable>
        )}

        {/* Simulador */}
        <GlassCard contentStyle={styles.cardInner}>
          <Text style={styles.cardTitle}>Simulador de investimento</Text>
          <Text style={styles.cardSub}>Arrasta para simular — atualiza ao vivo.</Text>

          <View style={styles.grid}>
            <NumInput label="Capital inicial" value={initial} onChangeText={setInitial} unit="€" />
          </View>

          {/* Reforço mensal — slider manual */}
          <View style={styles.control}>
            <View style={styles.controlHead}>
              <Text style={styles.fieldLabel}>Reforço mensal</Text>
              <Text style={styles.controlValue}>
                {formatMoney(monthly)}
                <Text style={styles.controlUnit}> /mês</Text>
              </Text>
            </View>
            <Slider value={monthly} min={0} max={2000} step={25} onChange={setMonthly} />
            <View style={styles.scaleRow}>
              <Text style={styles.scaleTxt}>0 €</Text>
              <Text style={styles.scaleTxt}>2000 €</Text>
            </View>
          </View>

          {/* Taxa de retorno — slider manual */}
          <View style={styles.control}>
            <View style={styles.controlHead}>
              <Text style={styles.fieldLabel}>Taxa de retorno anual</Text>
              <Text style={styles.controlValue}>
                {rate.toLocaleString("pt-PT")}
                <Text style={styles.controlUnit}> %/ano</Text>
              </Text>
            </View>
            <Slider value={rate} min={1} max={12} step={0.5} onChange={setRate} />
            <View style={styles.scaleRow}>
              <Text style={styles.scaleTxt}>1%</Text>
              <Text style={styles.scaleTxt}>12%</Text>
            </View>
          </View>

          {/* Prazo — botões */}
          <View style={styles.control}>
            <Text style={styles.fieldLabel}>Prazo</Text>
            <View style={styles.durChips}>
              {[1, 3, 5, 10, 20, 30].map((y) => {
                const active = years === y;
                return (
                  <Pressable
                    key={y}
                    onPress={() => setYears(y)}
                    style={[styles.durChip, active && styles.durChipActive]}
                  >
                    <Text
                      style={[styles.durChipTxt, active && styles.durChipTxtActive]}
                    >
                      {y} {y === 1 ? "ano" : "anos"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ExpoGradient
            colors={["rgba(53,214,197,0.14)", "rgba(53,214,197,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.result}
          >
            <Text style={styles.resultLabel}>
              Valor estimado ao fim de {years} {years === 1 ? "ano" : "anos"}
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
          </ExpoGradient>
        </GlassCard>

        {/* FIRE */}
        <GlassCard contentStyle={styles.cardInner}>
          <Text style={styles.cardTitle}>Liberdade financeira 🔥</Text>
          <Text style={styles.cardSub}>
            Arrasta para veres quanto precisas para viver dos juros.
          </Text>

          <View style={styles.grid}>
            <NumInput label="Património atual" value={current} onChangeText={setCurrent} unit="€" />
          </View>

          <View style={styles.control}>
            <View style={styles.controlHead}>
              <Text style={styles.fieldLabel}>Gasto mensal desejado</Text>
              <Text style={styles.controlValue}>
                {formatMoney(spend)}
                <Text style={styles.controlUnit}> /mês</Text>
              </Text>
            </View>
            <Slider
              value={spend}
              min={500}
              max={5000}
              step={50}
              onChange={setSpend}
              from="#FFCC80"
              to={colors.accents.orange}
            />
            <View style={styles.scaleRow}>
              <Text style={styles.scaleTxt}>500 €</Text>
              <Text style={styles.scaleTxt}>5000 €</Text>
            </View>
          </View>

          <View style={styles.control}>
            <View style={styles.controlHead}>
              <Text style={styles.fieldLabel}>Reforço mensal</Text>
              <Text style={styles.controlValue}>
                {formatMoney(fMonthly)}
                <Text style={styles.controlUnit}> /mês</Text>
              </Text>
            </View>
            <Slider
              value={fMonthly}
              min={0}
              max={2000}
              step={50}
              onChange={setFMonthly}
              from="#FFCC80"
              to={colors.accents.orange}
            />
            <View style={styles.scaleRow}>
              <Text style={styles.scaleTxt}>0 €</Text>
              <Text style={styles.scaleTxt}>2000 €</Text>
            </View>
          </View>

          <View style={styles.control}>
            <View style={styles.controlHead}>
              <Text style={styles.fieldLabel}>Taxa de levantamento</Text>
              <Text style={styles.controlValue}>
                {withdraw.toLocaleString("pt-PT")}
                <Text style={styles.controlUnit}> %/ano</Text>
              </Text>
            </View>
            <Slider
              value={withdraw}
              min={2}
              max={6}
              step={0.25}
              onChange={setWithdraw}
              from="#FFCC80"
              to={colors.accents.orange}
            />
            <View style={styles.scaleRow}>
              <Text style={styles.scaleTxt}>2%</Text>
              <Text style={styles.scaleTxt}>6%</Text>
            </View>
          </View>

          <View style={styles.control}>
            <View style={styles.controlHead}>
              <Text style={styles.fieldLabel}>Retorno anual esperado</Text>
              <Text style={styles.controlValue}>
                {fRate.toLocaleString("pt-PT")}
                <Text style={styles.controlUnit}> %/ano</Text>
              </Text>
            </View>
            <Slider
              value={fRate}
              min={1}
              max={12}
              step={0.5}
              onChange={setFRate}
              from="#FFCC80"
              to={colors.accents.orange}
            />
            <View style={styles.scaleRow}>
              <Text style={styles.scaleTxt}>1%</Text>
              <Text style={styles.scaleTxt}>12%</Text>
            </View>
          </View>

          <ExpoGradient
            colors={["rgba(255,149,0,0.14)", "rgba(255,55,95,0.03)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.result}
          >
            <Text style={styles.resultLabel}>Precisas de ter investido</Text>
            <Text style={styles.resultBig}>{formatMoney(fire.target)}</Text>
            <Text style={styles.cardSub}>
              para gerar {formatMoney(fire.income)} por ano ({formatMoney(fire.income / 12)}/mês)
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <ProgressBar
                progress={fireProgress}
                from="#FFCC80"
                to={colors.accents.orange}
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
          </ExpoGradient>
        </GlassCard>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  h1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.8,
    marginBottom: spacing.xs,
  },
  cardInner: { padding: spacing.lg, gap: spacing.sm },
  secHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  secTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  secLink: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
  portfolioInner: { padding: spacing.lg, gap: 2 },
  portfolioLabel: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  portfolioValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -1,
  },
  portfolioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  portfolioSub: { color: colors.textMuted, fontSize: 13.5, fontFamily: fonts.sans },
  empty: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: "center",
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
  control: { marginTop: spacing.md, gap: 6 },
  controlHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  controlValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.4,
  },
  controlUnit: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "400",
  },
  scaleRow: { flexDirection: "row", justifyContent: "space-between" },
  scaleTxt: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.sans },
  durChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  durChip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durChipActive: {
    backgroundColor: "rgba(53,214,197,0.16)",
    borderColor: colors.accents.teal,
  },
  durChipTxt: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  durChipTxtActive: { color: colors.accents.teal },
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
});
