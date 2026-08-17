import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Notification03Icon from "@hugeicons/core-free-icons/Notification03Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Coins01Icon from "@hugeicons/core-free-icons/Coins01Icon";
import PieChartIcon from "@hugeicons/core-free-icons/PieChartIcon";
import Target02Icon from "@hugeicons/core-free-icons/Target02Icon";
import { useAuth } from "@/contexts/AuthContext";
import {
  api,
  type Expense,
  type Goal,
  type Profile,
  type Subscription,
} from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { CategoryCard, type CategoryCardData } from "@/components/CategoryCard";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { GoalCard } from "@/components/GoalCard";
import { Tappable } from "@/components/Tappable";
import { FadeInUp } from "@/components/FadeInUp";
import { Donut, Ring, Sparkline } from "@/components/charts";
import { ProgressBar } from "@/components/ProgressBar";
import { confirmDelete } from "@/lib/confirm";
import { formatMoney } from "@/lib/format";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { colors, fonts, radius, shadow, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function monthKeyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
// Próximo débito de uma recorrência a partir do dia do mês.
function nextDueInfo(dueDay: number, now: Date) {
  const today = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();
  if (dueDay < today) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const dim = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dueDay, dim);
  const date = new Date(year, month, day);
  const base = new Date(now.getFullYear(), now.getMonth(), today);
  const days = Math.round((date.getTime() - base.getTime()) / 86400000);
  const label = days <= 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`;
  return { day, days, label };
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const name = new Intl.DateTimeFormat("pt-PT", { month: "long" }).format(
    new Date(y, m - 1, 1),
  );
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

type Period = "week" | "month" | "year";

export default function ExpensesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const name = (session?.user?.email ?? "").split("@")[0] || "Bem-vindo";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 20 ? "Boa tarde" : "Boa noite";
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [period, setPeriod] = useState<Period>("month");
  const [hidden, setHidden] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [income, setIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const listRef = useRef<FlatList<Expense>>(null);

  const load = useCallback(async () => {
    try {
      const [exp, gls, sbs, prof] = await Promise.all([
        api.listExpenses(),
        api.listGoals().catch(() => [] as Goal[]),
        api.listSubscriptions().catch(() => [] as Subscription[]),
        api
          .getProfile()
          .catch(
            () => ({ monthlyIncome: 0, mealAllowance: 0 }) as Profile,
          ),
      ]);
      setExpenses(exp ?? []);
      setGoals(gls ?? []);
      setSubs(sbs ?? []);
      setIncome((prof?.monthlyIncome || 0) + (prof?.mealAllowance || 0));
      setPhotoUrl(prof?.photoUrl);
    } catch (err) {
      Alert.alert("Erro ao carregar", (err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onPullRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);
  usePullToRefresh(
    () => (listRef.current as any)?.getScrollableNode?.(),
    onPullRefresh,
    setPullDist,
  );

  const now = new Date();
  const monthKey = monthKeyOf(now);
  const prevKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const monthExpenses = useMemo(
    () => expenses.filter((e) => (e.date ?? "").startsWith(monthKey)),
    [expenses, monthKey],
  );
  const monthTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + (e.amount || 0), 0),
    [monthExpenses],
  );
  const prevTotal = useMemo(
    () =>
      expenses
        .filter((e) => (e.date ?? "").startsWith(prevKey))
        .reduce((s, e) => s + (e.amount || 0), 0),
    [expenses, prevKey],
  );

  // Série cumulativa do mês (para o sparkline).
  const series = useMemo(() => {
    const today = now.getDate();
    const perDay = new Array(today + 1).fill(0);
    for (const e of monthExpenses) {
      const d = Number((e.date ?? "").split("-")[2]);
      if (d >= 1 && d <= today) perDay[d] += e.amount || 0;
    }
    const cum: number[] = [];
    let run = 0;
    for (let d = 1; d <= today; d++) {
      run += perDay[d];
      cum.push(run);
    }
    return cum.length ? cum : [0, 0];
  }, [monthExpenses, now]);

  const cards = useMemo<CategoryCardData[]>(() => {
    const map = new Map<string, CategoryCardData & { s: number }>();
    for (const e of monthExpenses) {
      const key = e.category?._id ?? "sem";
      const ex = map.get(key);
      if (ex) ex.spent += e.amount || 0;
      else
        map.set(key, {
          name: e.category?.name ?? "Sem categoria",
          icon: e.category?.icon ?? "💸",
          color: e.category?.color ?? colors.primary,
          budget: e.category?.budget,
          spent: e.amount || 0,
          currency: e.currency,
          s: 0,
        });
    }
    return [...map.values()]
      .sort((a, b) => b.spent - a.spent)
      .map(({ s, ...r }) => r);
  }, [monthExpenses]);

  const totalBudget = cards.reduce((s, c) => s + (c.budget || 0), 0);
  const budgetUsed = totalBudget > 0 ? Math.min(1, monthTotal / totalBudget) : 0;
  const budgetLeft = totalBudget - monthTotal;

  const subsMonthly = useMemo(
    () => subs.reduce((s, x) => s + (x.amount || 0), 0),
    [subs],
  );
  // Contas a pagar (C): recorrências com dia de débito, ordenadas por proximidade.
  const upcoming = useMemo(
    () =>
      subs
        .filter((s) => typeof s.dueDay === "number" && s.dueDay! >= 1)
        .map((s) => ({ sub: s, due: nextDueInfo(s.dueDay as number, now) }))
        .sort((a, b) => a.due.days - b.due.days)
        .slice(0, 4),
    [subs, now],
  );
  const totalSaved = useMemo(
    () => goals.reduce((s, g) => s + (g.saved || 0), 0),
    [goals],
  );

  // Dados agregados por período (Semana / Mês / Ano).
  const pd = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const addDays = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d;
    };
    let startStr: string;
    let prevStartStr: string;
    let prevEndStr: string;
    let label: string;
    let buckets: string[];

    if (period === "week") {
      startStr = isoLocal(addDays(-6));
      prevStartStr = isoLocal(addDays(-13));
      prevEndStr = isoLocal(addDays(-7));
      label = "últimos 7 dias";
      buckets = Array.from({ length: 7 }, (_, i) => isoLocal(addDays(-6 + i)));
    } else if (period === "year") {
      startStr = `${today.getFullYear()}-01-01`;
      prevStartStr = `${today.getFullYear() - 1}-01-01`;
      prevEndStr = `${today.getFullYear() - 1}-12-31`;
      label = String(today.getFullYear());
      buckets = Array.from({ length: today.getMonth() + 1 }, (_, i) =>
        `${today.getFullYear()}-${String(i + 1).padStart(2, "0")}`,
      );
    } else {
      startStr = `${monthKey}-01`;
      const pm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      prevStartStr = `${monthKeyOf(pm)}-01`;
      prevEndStr = isoLocal(new Date(today.getFullYear(), today.getMonth(), 0));
      label = monthLabel(monthKey);
      buckets = Array.from({ length: today.getDate() }, (_, i) =>
        `${monthKey}-${String(i + 1).padStart(2, "0")}`,
      );
    }
    const endStr = isoLocal(today);
    const inRange = expenses.filter((e) => e.date >= startStr && e.date <= endStr);
    const total = inRange.reduce((s, e) => s + (e.amount || 0), 0);
    const prev = expenses
      .filter((e) => e.date >= prevStartStr && e.date <= prevEndStr)
      .reduce((s, e) => s + (e.amount || 0), 0);

    const perBucket = new Map<string, number>(buckets.map((b) => [b, 0]));
    for (const e of inRange) {
      const key = period === "year" ? e.date.slice(0, 7) : e.date;
      if (perBucket.has(key))
        perBucket.set(key, perBucket.get(key)! + (e.amount || 0));
    }
    let run = 0;
    let series = buckets.map((b) => (run += perBucket.get(b) || 0));
    if (series.length < 2) series = [0, ...series];

    const divisor = period === "year" ? today.getMonth() + 1 : buckets.length || 1;
    return {
      total,
      delta: total - prev,
      hasPrev: prev > 0,
      series,
      label,
      avg: total / divisor,
      avgUnit: period === "year" ? "mês" : "dia",
    };
  }, [period, expenses, now, monthKey]);

  // Análise do mês — insights sobre os dados (regras, não IA).
  const insights = useMemo(() => {
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projection = daysElapsed > 0 ? (monthTotal / daysElapsed) * daysInMonth : monthTotal;
    const deltaPrev = monthTotal - prevTotal;
    const biggestCat = cards[0];
    const biggestSub = [...subs].sort((a, b) => b.amount - a.amount)[0];

    // Com salário definido, a análise é fidedigna: saldo e taxa de poupança.
    const hasIncome = income > 0;
    const balance = income - monthTotal;
    const savingsRate = hasIncome ? balance / income : 0;
    const projectedBalance = income - projection;

    let headline: string;
    if (hasIncome && projectedBalance >= 0) {
      headline = `Ao ritmo atual, sobram-te ${formatMoney(projectedBalance)} este mês (poupas ${Math.round(savingsRate * 100)}%).`;
    } else if (hasIncome && projectedBalance < 0) {
      headline = `Atenção: ao ritmo atual gastas ${formatMoney(Math.abs(projectedBalance))} acima do que recebes.`;
    } else if (prevTotal > 0 && deltaPrev < -0.02 * prevTotal) {
      headline = `Boa! Gastaste ${formatMoney(Math.abs(deltaPrev))} menos que no mês passado.`;
    } else if (prevTotal > 0 && deltaPrev > 0.02 * prevTotal) {
      headline = `Estás ${formatMoney(deltaPrev)} acima do mês passado — atenção ao ritmo.`;
    } else {
      headline = `Ao ritmo atual, o mês fecha em cerca de ${formatMoney(projection)}.`;
    }
    return {
      projection,
      biggestCat,
      biggestSub,
      headline,
      hasIncome,
      balance,
      savingsRate,
    };
  }, [monthTotal, prevTotal, cards, subs, now, income]);

  const onPhoto = async (uri: string) => {
    setPhotoUrl(uri);
    try {
      await api.updateProfile({ photoUrl: uri });
    } catch {
      /* fica guardado na próxima sincronização */
    }
  };

  const deleteSub = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      setSubs((p) => p.filter((s) => s._id !== id));
    } catch (err) {
      Alert.alert("Erro", (err as Error).message);
    }
  };

  const handleDelete = async (item: Expense) => {
    if (!(await confirmDelete("Apagar despesa", `Apagar "${item.title}"?`))) return;
    try {
      await api.deleteExpense(item._id);
      setExpenses((p) => p.filter((e) => e._id !== item._id));
    } catch (err) {
      Alert.alert("Erro", (err as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topbar}>
        <View style={styles.navLeft}>
          <Avatar uri={photoUrl} name={name} size={46} onChange={onPhoto} />
          <View>
            <Text style={styles.greetHi}>{greet}</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>
        <View style={styles.navRight}>
          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/(app)/(tabs)/conta")}
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={Notification03Icon as any}
              size={20}
              color={colors.text}
              strokeWidth={2}
            />
          </Pressable>
          <Pressable
            style={styles.navBtn}
            onPress={() => router.push("/(app)/(tabs)/transacoes")}
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={Search01Icon as any}
              size={20}
              color={colors.text}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>

      {(pullDist > 0 || refreshing) && (
        <View style={styles.pullIndicator} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <FlatList
        ref={listRef}
        data={expenses.slice(0, 5)}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.textMuted}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Wallet card */}
            <FadeInUp delay={40}>
            {/* Hero — sem container */}
            <View style={styles.hero}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabel}>Total gasto · {pd.label}</Text>
                <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
                  <Ionicons
                    name={hidden ? "eye-off-outline" : "eye-outline"}
                    size={15}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
              <View style={styles.heroAmountRow}>
                <Text
                  style={styles.heroAmount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {hidden ? "••••• €" : formatMoney(pd.total)}
                </Text>
                {pd.hasPrev && !hidden && (
                  <View
                    style={[
                      styles.deltaPill,
                      {
                        backgroundColor:
                          pd.delta >= 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.14)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deltaPillTxt,
                        { color: pd.delta >= 0 ? colors.danger : colors.success },
                      ]}
                    >
                      {pd.delta >= 0 ? "↑" : "↓"} {formatMoney(Math.abs(pd.delta))}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Chart — largura total, a fundir com o fundo (sem container) */}
            {pd.total > 0 && (
              <View style={styles.chartWrap}>
                <Sparkline
                  values={pd.series}
                  width={width}
                  height={128}
                  from="#7AA2FF"
                  to="#2F6BF6"
                  projection={
                    period === "month" ? insights.projection : undefined
                  }
                />
              </View>
            )}

            {/* Período */}
            <View style={styles.segmentedWrap}>
              <View style={styles.segmented}>
                {(["week", "month", "year"] as Period[]).map((p) => {
                  const labels: Record<Period, string> = {
                    week: "Semana",
                    month: "Mês",
                    year: "Ano",
                  };
                  const active = period === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPeriod(p)}
                      style={[styles.segBtn, active && styles.segBtnActive]}
                    >
                      <Text
                        style={[styles.segTxt, active && styles.segTxtActive]}
                      >
                        {labels[p]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Resumo / Análise — logo por baixo do gráfico, como na referência */}
            {monthExpenses.length > 0 && (
              <View style={styles.analise}>
                <View style={styles.analiseTop}>
                  <View style={styles.analiseRing}>
                    <Ring
                      size={64}
                      stroke={7}
                      progress={
                        totalBudget > 0
                          ? budgetUsed
                          : insights.hasIncome
                            ? Math.min(1, monthTotal / income)
                            : 0
                      }
                      color={colors.primary}
                      track={colors.surfaceAlt}
                      glow={false}
                    />
                    <View style={styles.analiseRingCenter}>
                      <Text style={styles.analiseRingPct}>
                        {Math.round(
                          (totalBudget > 0
                            ? budgetUsed
                            : insights.hasIncome
                              ? Math.min(1, monthTotal / income)
                              : 0) * 100,
                        )}
                        %
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.analiseLabel}>✦ Análise do mês</Text>
                    <Text style={styles.analiseHeadline}>{insights.headline}</Text>
                  </View>
                </View>
                <View style={styles.analiseRows}>
                  {insights.hasIncome ? (
                    <AnaliseRow icon={Coins01Icon}>
                      Saldo do mês: {formatMoney(insights.balance)} de{" "}
                      {formatMoney(income)} · poupas{" "}
                      {Math.round(insights.savingsRate * 100)}%
                    </AnaliseRow>
                  ) : (
                    <Pressable onPress={() => router.push("/(app)/rendimento")}>
                      <AnaliseRow icon={Coins01Icon} cta>
                        Define o teu rendimento para veres quanto poupas →
                      </AnaliseRow>
                    </Pressable>
                  )}
                  {insights.biggestCat && (
                    <AnaliseRow icon={PieChartIcon}>
                      Onde mais gastas: {insights.biggestCat.name} ·{" "}
                      {formatMoney(insights.biggestCat.spent)}
                    </AnaliseRow>
                  )}
                  <AnaliseRow icon={Target02Icon}>
                    Projeção fim do mês: ~{formatMoney(insights.projection)}
                  </AnaliseRow>
                </View>
              </View>
            )}

            {/* Fluxo do mês (D) — Rendimento / Despesas / Saldo */}
            {income > 0 && (
              <View style={styles.flow}>
                <View style={styles.flowCol}>
                  <Text style={styles.flowK}>Rendimento</Text>
                  <Text style={[styles.flowV, { color: colors.success }]}>
                    {formatMoney(income)}
                  </Text>
                </View>
                <View style={styles.flowDivider} />
                <View style={styles.flowCol}>
                  <Text style={styles.flowK}>Despesas</Text>
                  <Text style={[styles.flowV, { color: colors.danger }]}>
                    {formatMoney(monthTotal)}
                  </Text>
                </View>
                <View style={styles.flowDivider} />
                <View style={styles.flowCol}>
                  <Text style={styles.flowK}>Saldo</Text>
                  <Text
                    style={[
                      styles.flowV,
                      { color: income - monthTotal >= 0 ? colors.text : colors.danger },
                    ]}
                  >
                    {formatMoney(income - monthTotal)}
                  </Text>
                </View>
              </View>
            )}

            {/* Ações rápidas */}
            <View style={styles.actions}>
              <ActionBtn
                icon="add"
                label="Despesa"
                primary
                onPress={() => router.push("/(app)/new")}
              />
              <ActionBtn
                icon="flag-outline"
                label="Objetivo"
                onPress={() => router.push("/(app)/goal-form")}
              />
              <ActionBtn
                icon="trending-up"
                label="Investir"
                onPress={() => router.push("/(app)/(tabs)/investir")}
              />
            </View>
            </FadeInUp>

            {/* Grid: Para onde vai o teu dinheiro */}
            <FadeInUp delay={110}>
            <Text style={styles.gridTitle}>Para onde vai o teu dinheiro</Text>
            <View style={styles.grid}>
              <StatCard
                color={
                  totalBudget > 0 && budgetLeft < 0
                    ? colors.danger
                    : colors.accents.green
                }
                label="Orçamento"
              >
                {totalBudget > 0 ? (
                  <>
                    <View style={styles.gridRingRow}>
                      <Ring
                        size={34}
                        stroke={4}
                        progress={budgetUsed}
                        color={
                          budgetLeft < 0
                            ? colors.danger
                            : budgetUsed > 0.85
                              ? colors.accents.orange
                              : colors.success
                        }
                        track={colors.surfaceAlt}
                        glow={false}
                      />
                      <Text style={styles.gridValue}>
                        {Math.round(budgetUsed * 100)}%
                      </Text>
                    </View>
                    <Text style={styles.gridSub}>
                      {budgetLeft >= 0
                        ? `${formatMoney(budgetLeft)} livre`
                        : `${formatMoney(-budgetLeft)} acima`}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.gridValue}>—</Text>
                    <Text style={styles.gridSub}>Sem orçamento</Text>
                  </>
                )}
              </StatCard>

              <StatCard color={colors.accents.blue} label={`Média / ${pd.avgUnit}`}>
                <Text style={styles.gridValue}>{formatMoney(pd.avg)}</Text>
                <Text style={styles.gridSub}>neste período</Text>
              </StatCard>

              <StatCard color={colors.accents.purple} label="Recorrências">
                <Text style={styles.gridValue}>{formatMoney(subsMonthly)}</Text>
                <Text style={styles.gridSub}>por mês</Text>
              </StatCard>

              <StatCard color={colors.accents.orange} label="Poupança">
                <Text style={styles.gridValue}>{formatMoney(totalSaved)}</Text>
                <Text style={styles.gridSub}>
                  {goals.length} {goals.length === 1 ? "objetivo" : "objetivos"}
                </Text>
              </StatCard>
            </View>
            </FadeInUp>

            {/* Gastos por categoria — donut + legenda (A) */}
            {cards.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gastos por categoria</Text>
                <View style={styles.donutCard}>
                  <Donut
                    size={130}
                    thickness={20}
                    segments={cards.map((c) => ({ value: c.spent, color: c.color }))}
                  />
                  <View style={styles.legend}>
                    {cards.slice(0, 5).map((c) => (
                      <View key={c.name} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                        <Text style={styles.legendName} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.legendPct}>
                          {Math.round((c.spent / monthTotal) * 100)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <FlatList
                  horizontal
                  data={cards}
                  keyExtractor={(c, i) => c.name + i}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.cardsRow, { marginTop: spacing.md }]}
                  renderItem={({ item }) => <CategoryCard data={item} />}
                />
              </View>
            )}

            {/* Orçamentos — gasto vs limite por categoria (B) */}
            {cards.some((c) => !!c.budget && c.budget > 0) && (
              <View style={styles.section}>
                <View style={styles.secHead}>
                  <Text style={styles.secTitle}>Orçamentos</Text>
                  <Pressable onPress={() => router.push("/(app)/categorias")}>
                    <Text style={styles.secLink}>Gerir ›</Text>
                  </Pressable>
                </View>
                <View style={styles.budgetList}>
                  {cards
                    .filter((c) => !!c.budget && c.budget > 0)
                    .map((c, i) => {
                      const budget = c.budget as number;
                      const pct = Math.min(1, c.spent / budget);
                      const over = c.spent > budget;
                      return (
                        <View
                          key={c.name}
                          style={[styles.budgetRow, i > 0 && styles.budgetDivider]}
                        >
                          <View style={styles.budgetTop}>
                            <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                            <Text style={styles.budgetName} numberOfLines={1}>
                              {c.name}
                            </Text>
                            <Text style={styles.budgetNums}>
                              {formatMoney(c.spent)}{" "}
                              <Text style={styles.budgetOf}>
                                / {formatMoney(budget)}
                              </Text>
                            </Text>
                          </View>
                          <ProgressBar
                            progress={pct}
                            to={over ? colors.danger : c.color}
                            height={6}
                          />
                        </View>
                      );
                    })}
                </View>
              </View>
            )}

            {/* Contas a pagar (C) */}
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.secHead}>
                  <Text style={styles.secTitle}>Contas a pagar</Text>
                  <Pressable onPress={() => router.push("/(app)/sub-form")}>
                    <Text style={styles.secLink}>+ Nova</Text>
                  </Pressable>
                </View>
                <View style={styles.budgetList}>
                  {upcoming.map(({ sub, due }, i) => (
                    <View
                      key={sub._id}
                      style={[styles.dueRow, i > 0 && styles.budgetDivider]}
                    >
                      <View
                        style={[
                          styles.dueIcon,
                          { backgroundColor: tint(sub.color ?? "#6366F1", 0.16) },
                        ]}
                      >
                        <CategoryGlyph
                          icon={sub.icon}
                          size={18}
                          color={sub.color ?? colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dueName} numberOfLines={1}>
                          {sub.name}
                        </Text>
                        <Text
                          style={[
                            styles.dueWhen,
                            due.days <= 3 && { color: colors.danger },
                          ]}
                        >
                          dia {due.day} · {due.label}
                        </Text>
                      </View>
                      <Text style={styles.dueAmt}>{formatMoney(sub.amount)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Objetivos */}
            <View style={styles.section}>
              <View style={styles.secHead}>
                <Text style={styles.secTitle}>Objetivos</Text>
                <Pressable onPress={() => router.push("/(app)/goal-form")}>
                  <Text style={styles.secLink}>+ Novo</Text>
                </Pressable>
              </View>
              {goals.length > 0 ? (
                <FlatList
                  horizontal
                  data={goals}
                  keyExtractor={(g) => g._id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsRow}
                  renderItem={({ item }) => (
                    <GoalCard
                      goal={item}
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/goal",
                          params: {
                            id: item._id,
                            name: item.name,
                            icon: item.icon ?? "",
                            color: item.color ?? "",
                            target: String(item.target),
                            saved: String(item.saved),
                            monthly: String(item.monthly ?? 0),
                          },
                        })
                      }
                    />
                  )}
                />
              ) : (
                <Pressable
                  style={styles.emptyGoal}
                  onPress={() => router.push("/(app)/goal-form")}
                >
                  <Text style={styles.emptyGoalText}>
                    + Criar o teu primeiro objetivo
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Recorrências */}
            <View style={styles.section}>
              <View style={styles.secHead}>
                <Text style={styles.secTitle}>Recorrências</Text>
                <Pressable onPress={() => router.push("/(app)/sub-form")}>
                  <Text style={styles.secLink}>+ Nova</Text>
                </Pressable>
              </View>
              {subs.length > 0 ? (
                <View style={[styles.recurCard, styles.lightCard]}>
                  <Text style={styles.recurTotalLabel}>Total mensal</Text>
                  <Text style={styles.recurTotal}>{formatMoney(subsMonthly)}</Text>
                  <Text style={styles.recurYear}>
                    {formatMoney(subsMonthly * 12)} por ano
                  </Text>
                  <View style={{ marginTop: spacing.md }}>
                    {subs.map((s, i) => (
                      <View
                        key={s._id}
                        style={[styles.recurRow, i > 0 && styles.recurDivider]}
                      >
                        <View
                          style={[
                            styles.recurIcon,
                            { backgroundColor: tint(s.color ?? "#6366F1", 0.16) },
                          ]}
                        >
                          <CategoryGlyph
                            icon={s.icon}
                            size={17}
                            color={s.color ?? colors.primary}
                          />
                        </View>
                        <Text style={styles.recurName} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.recurAmt}>{formatMoney(s.amount)}</Text>
                        <Pressable onPress={() => deleteSub(s._id)} hitSlop={8}>
                          <Text style={styles.recurX}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Pressable
                  style={styles.emptyGoal}
                  onPress={() => router.push("/(app)/sub-form")}
                >
                  <Text style={styles.emptyGoalText}>
                    + Adicionar subscrição / gasto fixo
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={[styles.secHead, { marginTop: spacing.xl }]}>
              <Text style={styles.secTitle}>Movimentos</Text>
              <Pressable
                onPress={() => router.push("/(app)/(tabs)/transacoes")}
              >
                <Text style={styles.secLink}>Ver todas ›</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={26}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>Ainda sem despesas</Text>
              <Text style={styles.emptyText}>
                Toca no + para registares a primeira.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Tappable
            style={styles.rowWrap}
            scaleTo={0.98}
            onLongPress={() => handleDelete(item)}
            onPress={() =>
              router.push({
                pathname: "/(app)/new",
                params: {
                  id: item._id,
                  title: item.title,
                  amount: String(item.amount),
                  date: item.date,
                  note: item.note ?? "",
                  categoryId: item.category?._id ?? "",
                },
              })
            }
          >
            <View style={[styles.row, styles.lightCard]}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: tint(item.category?.color ?? "#6366F1", 0.16) },
                ]}
              >
                <CategoryGlyph
                  icon={item.category?.icon}
                  size={22}
                  color={item.category?.color ?? colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>
                  {[item.category?.name, item.date].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Text style={styles.rowAmount}>
                {formatMoney(item.amount, item.currency)}
              </Text>
            </View>
          </Tappable>
        )}
      />

    </SafeAreaView>
  );
}

function ActionBtn({
  icon,
  label,
  primary,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Tappable style={{ flex: 1 }} scaleTo={0.95} onPress={onPress}>
      <View style={[styles.actionBtn, primary && styles.actionBtnPrimary]}>
        <Ionicons name={icon} size={18} color={primary ? "#FFFFFF" : colors.text} />
        <Text style={[styles.actionTxt, primary && { color: "#FFFFFF" }]}>
          {label}
        </Text>
      </View>
    </Tappable>
  );
}

function AnaliseRow({
  icon,
  children,
  cta,
}: {
  icon: unknown;
  children: ReactNode;
  cta?: boolean;
}) {
  return (
    <View style={styles.aRow}>
      <HugeiconsIcon
        icon={icon as never}
        size={16}
        color={cta ? colors.primary : colors.textMuted}
        strokeWidth={2}
      />
      <Text style={[styles.analiseRow, { flex: 1 }, cta && styles.analiseCta]}>
        {children}
      </Text>
    </View>
  );
}

function StatCard({
  color,
  label,
  children,
}: {
  color: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.gridCard, styles.statCard]}>
      <View style={styles.statHead}>
        <View style={[styles.statDot, { backgroundColor: color }]} />
        <Text style={styles.gridLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  wallet: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  walletInner: { padding: spacing.lg },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans },
  walletAmount: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -1.6,
    marginTop: spacing.xs,
  },
  walletDelta: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.sans,
    marginTop: 6,
  },
  walletChart: { marginTop: spacing.md, marginHorizontal: -2, alignItems: "center" },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
  },
  segBtnActive: { backgroundColor: colors.surface, ...shadow.soft },
  segTxt: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  segTxtActive: { color: colors.text },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  actionBtnPrimary: { backgroundColor: colors.ink, borderColor: colors.ink },
  actionTxt: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  navLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  brand: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
  },
  pullIndicator: { alignItems: "center", paddingVertical: spacing.sm },
  greetRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  greetHi: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.sans },
  greetName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.3,
    textTransform: "capitalize",
    maxWidth: 200,
  },
  periods: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  periodTextActive: { color: "#fff" },
  gridTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "600",
    fontFamily: fonts.sans,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  gridCard: { flexGrow: 1, flexBasis: "47%" },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    gap: 6,
    minHeight: 96,
    ...shadow.card,
  },
  statHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  statDot: { width: 8, height: 8, borderRadius: 999 },
  gridInner: { padding: spacing.md, gap: 4, minHeight: 92 },
  gridLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.sans,
  },
  gridValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
  },
  gridSub: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontFamily: fonts.sans,
  },
  gridRingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  // Fluxo do mês (D)
  flow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: spacing.md,
    ...shadow.card,
  },
  flowCol: { flex: 1, alignItems: "center", gap: 3 },
  flowK: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.sans },
  flowV: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.4,
  },
  flowDivider: { width: 1, height: 30, backgroundColor: colors.border },
  // Donut de categorias (A)
  donutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    ...shadow.card,
  },
  legend: { flex: 1, gap: 9 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 999 },
  legendName: { flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.sans },
  legendPct: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  // Orçamentos por categoria (B)
  budgetList: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  budgetRow: { paddingVertical: 13, gap: 8 },
  budgetDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  budgetTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetName: { flex: 1, color: colors.text, fontSize: 14.5, fontFamily: fonts.sans },
  budgetNums: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  budgetOf: { color: colors.textMuted, fontWeight: "400" },
  // Contas a pagar (C)
  dueRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  dueIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  dueName: { color: colors.text, fontSize: 15, fontWeight: "500", fontFamily: fonts.sans },
  dueWhen: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans, marginTop: 1 },
  dueAmt: { color: colors.text, fontSize: 15, fontWeight: "600", fontFamily: fonts.sans },
  analise: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 22,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadow.card,
  },
  analiseTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  analiseRing: { width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  analiseRingCenter: {
    position: "absolute",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  analiseRingPct: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.sans,
  },
  analiseLabel: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: 0.3,
  },
  analiseHeadline: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginTop: 3,
  },
  analiseRows: { marginTop: spacing.md, gap: 8 },
  aRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  analiseRow: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.sans,
    lineHeight: 20,
  },
  analiseCta: {
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  headerAction: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 15,
    fontFamily: fonts.sans,
    paddingRight: spacing.md,
  },
  list: { paddingBottom: 150, gap: spacing.sm },

  hero: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroLabel: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.sans },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginTop: spacing.xs,
  },
  heroAmount: {
    color: colors.text,
    fontSize: 52,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -2,
  },
  deltaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  deltaPillTxt: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  chartWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    alignItems: "center",
  },
  segmentedWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },

  budget: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  budgetRing: { width: 66, height: 66, alignItems: "center", justifyContent: "center" },
  budgetPct: { position: "absolute", width: 66, height: 66, alignItems: "center", justifyContent: "center" },
  budgetPctTxt: { color: colors.text, fontSize: 15, fontWeight: "600", fontFamily: fonts.sans },
  budgetBig: { color: colors.text, fontSize: 17, fontWeight: "500", fontFamily: fonts.sans },
  budgetSub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans, marginTop: 3 },

  section: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "600",
    fontFamily: fonts.sans,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  secHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  emptyGoal: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyGoalText: { color: colors.textMuted, fontFamily: fonts.sans },
  recurCard: { marginHorizontal: spacing.lg },
  recurInner: { padding: spacing.md },
  recurTotalLabel: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  recurTotal: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  recurYear: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  recurRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 10,
  },
  recurDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  recurIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  recurName: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.sans },
  recurAmt: { color: colors.text, fontSize: 15, fontWeight: "500", fontFamily: fonts.sans },
  recurX: { color: colors.textMuted, fontSize: 22, paddingHorizontal: 4 },

  listTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "600",
    fontFamily: fonts.sans,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },

  lightCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    ...shadow.card,
  },
  rowWrap: { marginHorizontal: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: "500", fontFamily: fonts.sans },
  rowMeta: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans, marginTop: 2 },
  rowAmount: { color: colors.text, fontSize: 16, fontWeight: "500", fontFamily: fonts.sans },

  empty: { alignItems: "center", marginTop: spacing.xl * 2, gap: spacing.sm },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "600", fontFamily: fonts.sans },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans },

  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: 104,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#0A0A0B", fontSize: 32, marginTop: -2, fontFamily: fonts.sans },
});
