import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { api, type Category, type Expense } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { Tappable } from "@/components/Tappable";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function lighten(hex: string, a = 0.5) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * a);
  return `#${((1 << 24) + (mix((n >> 16) & 255) << 16) + (mix((n >> 8) & 255) << 8) + mix(n & 255)).toString(16).slice(1)}`;
}

export default function Categorias() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.listCategories().then(setCategories).catch(() => setCategories([]));
      api.listExpenses().then(setExpenses).catch(() => setExpenses([]));
    }, []),
  );

  const monthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const spentByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (!(e.date ?? "").startsWith(monthKey)) continue;
      const id = e.category?._id;
      if (!id) continue;
      map.set(id, (map.get(id) ?? 0) + (e.amount || 0));
    }
    return map;
  }, [expenses, monthKey]);

  const open = (c?: Category) =>
    router.push({
      pathname: "/(app)/categoria-form",
      params: c
        ? {
            id: c._id,
            name: c.name,
            icon: c.icon ?? "",
            color: c.color ?? "",
            budget: String(c.budget ?? ""),
          }
        : {},
    });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Categorias" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Cria e ajusta as tuas categorias e orçamentos mensais. É isto que
          alimenta o cartão "Orçamento" e a análise de gastos.
        </Text>

        {categories.length === 0 && (
          <Text style={styles.empty}>
            Ainda não tens categorias. Cria a primeira já a seguir.
          </Text>
        )}

        <View style={{ gap: spacing.sm }}>
          {categories.map((c) => {
            const color = c.color || colors.primary;
            const spent = spentByCat.get(c._id) ?? 0;
            const budget = c.budget ?? 0;
            const pct = budget > 0 ? Math.min(1, spent / budget) : 0;
            const over = budget > 0 && spent > budget;
            return (
              <Tappable key={c._id} scaleTo={0.98} onPress={() => open(c)}>
                <GlassCard contentStyle={styles.row}>
                  <View style={styles.head}>
                    <View style={[styles.icon, { backgroundColor: color }]}>
                      <CategoryGlyph icon={c.icon} size={20} color="#0A0A0B" />
                    </View>
                    <Text style={styles.name} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.amount}>
                      {budget > 0
                        ? `${formatMoney(spent)} / ${formatMoney(budget)}`
                        : formatMoney(spent)}
                    </Text>
                  </View>
                  {budget > 0 ? (
                    <View style={{ marginTop: spacing.sm, gap: 4 }}>
                      <ProgressBar
                        progress={pct}
                        from={lighten(over ? colors.danger : color)}
                        to={over ? colors.danger : color}
                        height={6}
                      />
                      <Text style={[styles.sub, over && { color: colors.danger }]}>
                        {over
                          ? `${formatMoney(spent - budget)} acima do orçamento`
                          : `${formatMoney(budget - spent)} disponível`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.subMuted}>Sem orçamento definido</Text>
                  )}
                </GlassCard>
              </Tappable>
            );
          })}
        </View>

        <View style={{ height: spacing.md }} />
        <Button label="+ Nova categoria" onPress={() => open()} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  intro: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.sans,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  row: { padding: spacing.md },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
  amount: { color: colors.text, fontSize: 14, fontFamily: fonts.sans },
  sub: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans },
  subMuted: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontFamily: fonts.sans,
    marginTop: spacing.sm,
  },
});
