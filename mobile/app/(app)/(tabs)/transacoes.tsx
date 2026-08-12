import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, type Category, type Expense } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { Tappable } from "@/components/Tappable";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function dayLabel(iso: string) {
  const now = new Date();
  const today = isoLocal(now);
  const yst = isoLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  if (iso === today) return "Hoje";
  if (iso === yst) return "Ontem";
  const d = new Date(iso + "T00:00:00");
  const s = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
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

  // Agrupar por dia (mantém a ordem descendente do `filtered`).
  const sections = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const arr = map.get(e.date);
      if (arr) arr.push(e);
      else map.set(e.date, [e]);
    }
    return [...map.entries()].map(([date, data]) => ({
      title: dayLabel(date),
      sum: data.reduce((s, e) => s + (e.amount || 0), 0),
      data,
    }));
  }, [filtered]);

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

      {/* Filtro por categoria — linha que quebra (sem scroll horizontal, que
          colapsa a altura no iOS). */}
      {categories.length > 0 && (
        <View style={styles.filtersRow}>
          {[{ _id: "__all", name: "Todas", icon: "", color: "" } as Category, ...categories].map(
            (item) => {
              const isAll = item._id === "__all";
              const active = isAll ? catFilter === null : catFilter === item._id;
              const color = item.color || colors.primary;
              return (
                <Pressable
                  key={item._id}
                  onPress={() => setCatFilter(isAll ? null : item._id)}
                  style={[
                    styles.filterChip,
                    active && { backgroundColor: tint(color, 0.16), borderColor: color },
                  ]}
                >
                  {!isAll && (
                    <CategoryGlyph
                      icon={item.icon}
                      size={16}
                      color={active ? color : colors.textMuted}
                    />
                  )}
                  <Text style={[styles.filterText, active && { color }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(e) => e._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma transação</Text>
            <Text style={styles.emptyText}>
              {query || catFilter
                ? "Experimenta ajustar a pesquisa ou o filtro."
                : "Toca no + no Início para registares a primeira."}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.secHeader}>
            <Text style={styles.secTitle}>{section.title}</Text>
            <Text style={styles.secSum}>{formatMoney(section.sum)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Tappable
            style={styles.rowWrap}
            scaleTo={0.98}
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
                <CategoryGlyph
                  icon={item.category?.icon}
                  size={22}
                  color={item.category?.color ?? colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>
                  {item.category?.name ?? "Sem categoria"}
                </Text>
              </View>
              <Text style={styles.rowAmount}>
                {formatMoney(item.amount, item.currency)}
              </Text>
            </GlassCard>
          </Tappable>
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
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterText: { color: colors.text, fontSize: 14, fontFamily: fonts.sans },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120 },
  secHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  secTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.sans,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  secSum: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  rowWrap: { marginBottom: spacing.sm },
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
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "600", fontFamily: fonts.sans },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.sans,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
});
