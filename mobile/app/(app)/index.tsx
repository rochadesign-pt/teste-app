import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, Stack, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Expense } from "@/lib/api";
import { CategoryCard, type CategoryCardData } from "@/components/CategoryCard";
import { formatMoney } from "@/lib/format";
import { colors, radius, spacing } from "@/constants/theme";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const name = new Intl.DateTimeFormat("pt-PT", { month: "long" }).format(d);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

export default function ExpensesScreen() {
  const { signOut } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listExpenses();
      setExpenses(data);
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

  const monthKey = currentMonthKey();

  const monthExpenses = useMemo(
    () => expenses.filter((e) => (e.date ?? "").startsWith(monthKey)),
    [expenses, monthKey],
  );

  const monthTotal = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [monthExpenses],
  );

  // Cartões de categoria (gasto vs orçamento) do mês atual.
  const categoryCards = useMemo<CategoryCardData[]>(() => {
    const map = new Map<
      string,
      CategoryCardData & { _sort: number }
    >();
    for (const e of monthExpenses) {
      const key = e.category?._id ?? "sem";
      const existing = map.get(key);
      if (existing) {
        existing.spent += e.amount || 0;
      } else {
        map.set(key, {
          name: e.category?.name ?? "Sem categoria",
          icon: e.category?.icon ?? "💸",
          color: e.category?.color ?? colors.primary,
          budget: e.category?.budget,
          spent: e.amount || 0,
          currency: e.currency,
          _sort: 0,
        });
      }
    }
    return [...map.values()]
      .sort((a, b) => b.spent - a.spent)
      .map(({ _sort, ...rest }) => rest);
  }, [monthExpenses]);

  const handleDelete = (item: Expense) => {
    Alert.alert("Apagar despesa", `Apagar "${item.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteExpense(item._id);
            setExpenses((prev) => prev.filter((e) => e._id !== item._id));
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
        keyExtractor={(item) => item._id}
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
            {/* Cartão de resumo do mês */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryMonth}>{monthLabel(monthKey)}</Text>
              <Text style={styles.summaryValue}>{formatMoney(monthTotal)}</Text>
              <Text style={styles.summaryCount}>
                {monthExpenses.length}{" "}
                {monthExpenses.length === 1 ? "despesa" : "despesas"} este mês
              </Text>
            </View>

            {/* Gastos por categoria (horizontal) */}
            {categoryCards.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Gastos por categoria</Text>
                  <Text style={styles.sectionLink}>Ver tudo ›</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsRow}
                >
                  {categoryCards.map((c, i) => (
                    <CategoryCard key={c.name + i} data={c} />
                  ))}
                </ScrollView>
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
          <Pressable
            style={styles.card}
            onLongPress={() => handleDelete(item)}
          >
            <View style={styles.cardIcon}>
              <Text style={{ fontSize: 20 }}>
                {item.category?.icon ?? "💸"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {[item.category?.name, item.date].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <Text style={styles.cardAmount}>
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
    paddingRight: spacing.md,
  },
  list: { paddingBottom: 120, gap: spacing.sm },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  summaryMonth: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 40,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  summaryCount: { color: colors.textMuted, fontSize: 14, marginTop: 2 },

  section: { marginTop: spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  sectionLink: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  cardsRow: { paddingHorizontal: spacing.lg, gap: spacing.md },

  listTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },

  card: {
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
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  cardAmount: { color: colors.text, fontSize: 16, fontWeight: "700" },

  empty: { alignItems: "center", marginTop: spacing.xl * 2, gap: spacing.xs },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "600" },
  emptyText: { color: colors.textMuted },

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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: colors.primaryText, fontSize: 32, marginTop: -2 },
});
