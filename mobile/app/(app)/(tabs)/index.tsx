import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Expense, type Goal, type Subscription } from "@/lib/api";
import { CategoryCard, type CategoryCardData } from "@/components/CategoryCard";
import { GoalCard } from "@/components/GoalCard";
import { GlassCard } from "@/components/GlassCard";
import { GradientStatCard } from "@/components/GradientStatCard";
import { Tappable } from "@/components/Tappable";
import { FadeInUp } from "@/components/FadeInUp";
import { Aura } from "@/components/Aura";
import { Ring, Sparkline } from "@/components/charts";
import { formatMoney } from "@/lib/format";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { colors, fonts, radius, spacing } from "@/constants/theme";

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
  const name = (session?.user?.email ?? "").split("@")[0] || "Bem-vindo";
  const initial = name.charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 20 ? "Boa tarde" : "Boa noite";
  const [period, setPeriod] = useState<Period>("month");
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
          .catch(() => ({ monthlyIncome: 0, mealAllowance: 0 })),
      ]);
      setExpenses(exp);
      setGoals(gls);
      setSubs(sbs);
      setIncome((prof.monthlyIncome || 0) + (prof.mealAllowance || 0));
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

  const deleteSub = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      setSubs((p) => p.filter((s) => s._id !== id));
    } catch (err) {
      Alert.alert("Erro", (err as Error).message);
    }
  };

  const handleDelete = (item: Expense) => {
    Alert.alert("Apagar despesa", `Apagar "${item.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteExpense(item._id);
            setExpenses((p) => p.filter((e) => e._id !== item._id));
          } catch (err) {
            Alert.alert("Erro", (err as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Aura />
      <View style={styles.topbar}>
        <View style={styles.greetRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.greetHi}>{greet} 👋</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/conta")}
          hitSlop={8}
        >
          <Ionicons
            name="person-circle-outline"
            size={30}
            color={colors.textMuted}
          />
        </Pressable>
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
            {/* Seletor de período */}
            <View style={styles.periods}>
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
                    style={[styles.periodBtn, active && styles.periodBtnActive]}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        active && styles.periodTextActive,
                      ]}
                    >
                      {labels[p]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Hero */}
            <FadeInUp delay={40}>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Total gasto · {pd.label}</Text>
              <Text style={styles.heroAmount}>{formatMoney(pd.total)}</Text>
              {pd.hasPrev && (
                <Text style={styles.heroDelta}>
                  <Text
                    style={{
                      color: pd.delta >= 0 ? "#FF7A6B" : colors.success,
                    }}
                  >
                    {pd.delta >= 0 ? "↑" : "↓"}
                  </Text>{" "}
                  {formatMoney(Math.abs(pd.delta))} vs período anterior
                </Text>
              )}
              {pd.total > 0 && (
                <View style={{ marginTop: spacing.sm }}>
                  <Sparkline values={pd.series} width={340} height={84} />
                </View>
              )}
            </View>
            </FadeInUp>

            {/* Grid: Para onde vai o teu dinheiro */}
            <FadeInUp delay={110}>
            <Text style={styles.gridTitle}>Para onde vai o teu dinheiro</Text>
            <View style={styles.grid}>
              <GradientStatCard
                color={
                  totalBudget > 0 && budgetLeft < 0
                    ? colors.danger
                    : colors.accents.green
                }
                style={styles.gridCard}
                contentStyle={styles.gridInner}
              >
                <Text style={styles.gridLabel}>Orçamento</Text>
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
              </GradientStatCard>

              <GradientStatCard
                color={colors.accents.blue}
                style={styles.gridCard}
                contentStyle={styles.gridInner}
              >
                <Text style={styles.gridLabel}>Média / {pd.avgUnit}</Text>
                <Text style={styles.gridValue}>{formatMoney(pd.avg)}</Text>
                <Text style={styles.gridSub}>neste período</Text>
              </GradientStatCard>

              <GradientStatCard
                color={colors.accents.purple}
                style={styles.gridCard}
                contentStyle={styles.gridInner}
              >
                <Text style={styles.gridLabel}>Recorrências</Text>
                <Text style={styles.gridValue}>{formatMoney(subsMonthly)}</Text>
                <Text style={styles.gridSub}>por mês</Text>
              </GradientStatCard>

              <GradientStatCard
                color={colors.accents.orange}
                style={styles.gridCard}
                contentStyle={styles.gridInner}
              >
                <Text style={styles.gridLabel}>Poupança</Text>
                <Text style={styles.gridValue}>{formatMoney(totalSaved)}</Text>
                <Text style={styles.gridSub}>
                  {goals.length} {goals.length === 1 ? "objetivo" : "objetivos"}
                </Text>
              </GradientStatCard>
            </View>
            </FadeInUp>

            {/* Análise do mês */}
            {monthExpenses.length > 0 && (
              <FadeInUp delay={180}>
              <LinearGradient
                colors={["#6366F1", "#5B4FE0", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.analise}
              >
                <View style={styles.blob1} />
                <View style={styles.blob2} />
                <Text style={styles.analiseLabel}>✦ Análise do mês</Text>
                <Text style={styles.analiseHeadline}>{insights.headline}</Text>
                <View style={styles.analiseRows}>
                  {insights.hasIncome ? (
                    <Text style={styles.analiseRow}>
                      💰 Saldo do mês: {formatMoney(insights.balance)} de{" "}
                      {formatMoney(income)} · poupas{" "}
                      {Math.round(insights.savingsRate * 100)}%
                    </Text>
                  ) : (
                    <Pressable onPress={() => router.push("/(app)/rendimento")}>
                      <Text style={[styles.analiseRow, styles.analiseCta]}>
                        💰 Define o teu rendimento para veres quanto poupas →
                      </Text>
                    </Pressable>
                  )}
                  {insights.biggestCat && (
                    <Text style={styles.analiseRow}>
                      📊 Onde mais gastas: {insights.biggestCat.name} ·{" "}
                      {formatMoney(insights.biggestCat.spent)}
                    </Text>
                  )}
                  <Text style={styles.analiseRow}>
                    🎯 Projeção fim do mês: ~{formatMoney(insights.projection)}
                  </Text>
                  {insights.biggestSub && (
                    <Text style={styles.analiseRow}>
                      💡 Cortar {insights.biggestSub.name} poupa{" "}
                      {formatMoney(insights.biggestSub.amount * 12)}/ano
                    </Text>
                  )}
                </View>
              </LinearGradient>
              </FadeInUp>
            )}

            {/* Categorias */}
            {cards.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gastos por categoria</Text>
                <FlatList
                  horizontal
                  data={cards}
                  keyExtractor={(c, i) => c.name + i}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsRow}
                  renderItem={({ item }) => <CategoryCard data={item} />}
                />
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
                <GlassCard style={styles.recurCard} contentStyle={styles.recurInner}>
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
                          <Text style={{ fontSize: 15 }}>{s.icon ?? "💳"}</Text>
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
                </GlassCard>
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
            <GlassCard r={radius.md} contentStyle={styles.row}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: tint(item.category?.color ?? "#6366F1", 0.16) },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{item.category?.icon ?? "💸"}</Text>
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
            </GlassCard>
          </Tappable>
        )}
      />

      <Tappable style={styles.fab} scaleTo={0.9} onPress={() => router.push("/(app)/new")}>
        <LinearGradient
          colors={["#818CF8", "#6366F1", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </Tappable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
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
  gridInner: { padding: spacing.md, gap: 4, minHeight: 92 },
  gridLabel: {
    color: "rgba(235,235,245,0.72)",
    fontSize: 13,
    fontFamily: fonts.sans,
  },
  gridValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "500",
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
  },
  gridSub: {
    color: "rgba(235,235,245,0.55)",
    fontSize: 12.5,
    fontFamily: fonts.sans,
  },
  gridRingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  analise: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: "hidden",
    position: "relative",
  },
  blob1: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -70,
    right: -40,
  },
  blob2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -34,
    left: 44,
  },
  analiseLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: 0.3,
  },
  analiseHeadline: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.4,
    lineHeight: 27,
    marginTop: spacing.sm,
  },
  analiseRows: { marginTop: spacing.md, gap: 6 },
  analiseRow: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    fontFamily: fonts.sans,
    lineHeight: 20,
  },
  analiseCta: {
    color: "#fff",
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
  list: { paddingBottom: 120, gap: spacing.sm },

  hero: { alignItems: "center", paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
  heroLabel: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans },
  heroAmount: {
    color: colors.text,
    fontSize: 52,
    fontWeight: "400",
    fontFamily: fonts.sans,
    letterSpacing: -1.8,
    marginTop: spacing.sm,
  },
  heroDelta: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans, marginTop: 6 },

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
  cardsRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
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

  empty: { alignItems: "center", marginTop: spacing.xl * 2, gap: spacing.xs },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "600", fontFamily: fonts.sans },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans },

  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 18,
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
  fabText: { color: colors.primaryText, fontSize: 32, marginTop: -2, fontFamily: fonts.sans },
});
