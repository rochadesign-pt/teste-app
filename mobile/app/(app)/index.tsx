import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, Stack, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Expense } from "@/lib/api";
import { CategoryCard, type CategoryCardData } from "@/components/CategoryCard";
import { Ring, Sparkline } from "@/components/charts";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
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

export default function ExpensesScreen() {
  const { signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setExpenses(await api.listExpenses());
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

  const delta = monthTotal - prevTotal;

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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => signOut()} hitSlop={12}>
              <Text style={styles.headerAction}>Sair</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={expenses}
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
            {/* Hero */}
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Total gasto · {monthLabel(monthKey)}</Text>
              <Text style={styles.heroAmount}>{formatMoney(monthTotal)}</Text>
              {prevTotal > 0 && (
                <Text style={styles.heroDelta}>
                  <Text style={{ color: delta >= 0 ? "#FF7A6B" : colors.success }}>
                    {delta >= 0 ? "↑" : "↓"}
                  </Text>{" "}
                  {formatMoney(Math.abs(delta))} vs mês anterior
                </Text>
              )}
              {monthTotal > 0 && (
                <View style={{ marginTop: spacing.sm }}>
                  <Sparkline values={series} width={340} height={80} />
                </View>
              )}
            </View>

            {/* Orçamento */}
            {totalBudget > 0 && (
              <View style={styles.budget}>
                <View style={styles.budgetRing}>
                  <Ring
                    size={66}
                    stroke={6}
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
                  <View style={styles.budgetPct}>
                    <Text style={styles.budgetPctTxt}>
                      {Math.round(budgetUsed * 100)}%
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.budgetBig}>
                    {budgetLeft >= 0
                      ? `${formatMoney(budgetLeft)} por gastar`
                      : `${formatMoney(-budgetLeft)} acima`}
                  </Text>
                  <Text style={styles.budgetSub}>
                    {budgetLeft < 0
                      ? "Passaste o orçamento do mês."
                      : budgetUsed < 0.5
                        ? "Muito controlado — bom ritmo."
                        : budgetUsed < 0.8
                          ? "Dentro do orçamento previsto."
                          : "A aproximar-te do limite."}
                  </Text>
                </View>
              </View>
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

            <Text style={styles.listTitle}>Movimentos</Text>
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
          <Pressable style={styles.row} onLongPress={() => handleDelete(item)}>
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
          </Pressable>
        )}
      />

      <Link href="/(app)/new" asChild>
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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

  listTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "600",
    fontFamily: fonts.sans,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabText: { color: colors.primaryText, fontSize: 32, marginTop: -2, fontFamily: fonts.sans },
});
