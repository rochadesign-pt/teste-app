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
import { Link, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Expense } from "@/lib/api";
import { colors, radius, spacing } from "@/constants/theme";

function formatMoney(amount: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
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

  // Recarrega sempre que o ecrã ganha foco (ex.: ao voltar de "Nova despesa").
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses],
  );

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
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryValue}>{formatMoney(total)}</Text>
        <Pressable onPress={() => signOut()} hitSlop={12}>
          <Text style={styles.signout}>Sair</Text>
        </Pressable>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
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
  summary: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 36, fontWeight: "700" },
  signout: {
    position: "absolute",
    right: 0,
    bottom: 8,
    color: colors.textMuted,
    fontWeight: "600",
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
