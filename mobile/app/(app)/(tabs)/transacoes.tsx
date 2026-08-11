import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, type Category, type Expense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function Transacoes() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const load = useCallback(() => {
    api.listExpenses().then(setExpenses).catch(() => {});
    api.listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...expenses]
      .filter((e) => (catFilter ? e.category?._id === catFilter : true))
      .filter((e) => (q ? e.title.toLowerCase().includes(q) : true))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [expenses, query, catFilter]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + (e.amount || 0), 0),
    [filtered],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Transações</Text>
        <Text style={styles.total}>
          {filtered.length} · {formatMoney(total)}
        </Text>
      </View>

      {/* Pesquisa */}
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Pesquisar…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filtro por categoria */}
      {categories.length > 0 && (
        <FlatList
          horizontal
          data={[{ _id: "__all", name: "Todas", icon: "", color: "" } as Category, ...categories]}
          keyExtractor={(c) => c._id}
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={styles.filtersRow}
          renderItem={({ item }) => {
            const isAll = item._id === "__all";
            const active = isAll ? catFilter === null : catFilter === item._id;
            const color = item.color || colors.primary;
            return (
              <Pressable
                onPress={() => setCatFilter(isAll ? null : item._id)}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: tint(color, 0.16), borderColor: color },
                ]}
              >
                <Text style={styles.filterText}>
                  {item.icon ? item.icon + " " : ""}
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(e) => e._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma transação encontrada.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  h1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.8,
  },
  total: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans, marginBottom: 4 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.sans,
    height: "100%",
  },
  filters: { marginTop: spacing.md, flexGrow: 0 },
  filtersRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterText: { color: colors.text, fontSize: 14, fontFamily: fonts.sans },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl, fontFamily: fonts.sans },
});
