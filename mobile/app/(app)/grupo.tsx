import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, type Trip } from "@/lib/api";
import { tripStats } from "@/lib/split";
import { formatMoney } from "@/lib/format";
import { colors, fonts, shadow, spacing } from "@/constants/theme";

export default function Grupo() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);

  const load = useCallback(() => {
    if (id) api.getTrip(id).then(setTrip);
  }, [id]);
  useFocusEffect(useCallback(() => load(), [load]));

  if (!trip) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Stack.Screen options={{ title: "Viagem" }} />
        <Text style={{ color: colors.textMuted, fontFamily: fonts.sans }}>A carregar…</Text>
      </View>
    );
  }

  const s = tripStats(trip);
  const nameOf = (mid: string) =>
    trip.members.find((m) => m.id === mid)?.name ?? "—";

  const removeExpense = (expenseId: string, desc: string) => {
    Alert.alert("Apagar despesa", `Apagar "${desc}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await api.deleteTripExpense(trip._id, expenseId);
          load();
        },
      },
    ]);
  };

  const removeTrip = () => {
    Alert.alert("Apagar viagem", `Apagar "${trip.name}" e todas as despesas?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await api.deleteTrip(trip._id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: trip.name,
          headerRight: () => (
            <Pressable onPress={removeTrip} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Resumo */}
        <View style={styles.hero}>
          <View style={styles.emojiWrap}>
            <Text style={{ fontSize: 30 }}>{trip.emoji}</Text>
          </View>
          <Text style={styles.total}>{formatMoney(s.total, trip.currency)}</Text>
          <Text style={styles.totalSub}>
            {formatMoney(s.perHead, trip.currency)} por pessoa ·{" "}
            {trip.members.length} pessoas
          </Text>
        </View>

        {/* Saldos */}
        <Text style={styles.sectionTitle}>Saldos</Text>
        <View style={styles.card}>
          {s.balances.map((b, i) => (
            <View
              key={b.member.id}
              style={[styles.balRow, i > 0 && styles.divider]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>
                  {b.member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.balName}>{b.member.name}</Text>
                <Text style={styles.balPaid}>
                  adiantou {formatMoney(b.paid, trip.currency)}
                </Text>
              </View>
              <Text
                style={[
                  styles.balNet,
                  {
                    color:
                      b.net > 0.01
                        ? colors.success
                        : b.net < -0.01
                          ? colors.danger
                          : colors.textMuted,
                  },
                ]}
              >
                {b.net > 0.01
                  ? `recebe ${formatMoney(b.net, trip.currency)}`
                  : b.net < -0.01
                    ? `deve ${formatMoney(-b.net, trip.currency)}`
                    : "acertado"}
              </Text>
            </View>
          ))}
        </View>

        {/* Acertar contas */}
        {s.settlements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Acertar contas</Text>
            <View style={styles.card}>
              {s.settlements.map((st, i) => (
                <View
                  key={`${st.from.id}-${st.to.id}`}
                  style={[styles.settleRow, i > 0 && styles.divider]}
                >
                  <Text style={styles.settleTxt}>
                    <Text style={styles.settleName}>{st.from.name}</Text> paga a{" "}
                    <Text style={styles.settleName}>{st.to.name}</Text>
                  </Text>
                  <Text style={styles.settleAmt}>
                    {formatMoney(st.amount, trip.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Despesas */}
        <View style={styles.despHead}>
          <Text style={styles.sectionTitle}>Despesas</Text>
          <Pressable
            onPress={() =>
              router.push({ pathname: "/(app)/grupo-despesa", params: { id: trip._id } })
            }
          >
            <Text style={styles.addLink}>+ Adicionar</Text>
          </Pressable>
        </View>

        {trip.expenses.length === 0 ? (
          <Pressable
            style={styles.emptyDesp}
            onPress={() =>
              router.push({ pathname: "/(app)/grupo-despesa", params: { id: trip._id } })
            }
          >
            <Text style={styles.emptyDespTxt}>
              + Regista a primeira despesa da viagem
            </Text>
          </Pressable>
        ) : (
          <View style={styles.card}>
            {trip.expenses.map((e, i) => (
              <Pressable
                key={e.id}
                onLongPress={() => removeExpense(e.id, e.description)}
                style={[styles.expRow, i > 0 && styles.divider]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.expDesc}>{e.description}</Text>
                  <Text style={styles.expMeta}>
                    {nameOf(e.paidBy)} pagou · dividido por{" "}
                    {e.split.length || trip.members.length}
                  </Text>
                </View>
                <Text style={styles.expAmt}>
                  {formatMoney(e.amount, trip.currency)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.hint}>
          Mantém premida uma despesa para a apagar.
        </Text>
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() =>
          router.push({ pathname: "/(app)/grupo-despesa", params: { id: trip._id } })
        }
      >
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabTxt}>Despesa</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 110 },
  hero: { alignItems: "center", marginBottom: spacing.md },
  emojiWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  total: {
    color: colors.text,
    fontSize: 40,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -1.4,
    marginTop: spacing.md,
  },
  totalSub: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans, marginTop: 2 },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: fonts.sans,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  balRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontWeight: "600", fontFamily: fonts.sans },
  balName: { color: colors.text, fontSize: 15, fontWeight: "500", fontFamily: fonts.sans },
  balPaid: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans, marginTop: 1 },
  balNet: { fontSize: 14.5, fontWeight: "600", fontFamily: fonts.sans },
  settleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  settleTxt: { color: colors.textMuted, fontSize: 14.5, fontFamily: fonts.sans },
  settleName: { color: colors.text, fontWeight: "600" },
  settleAmt: { color: colors.text, fontSize: 15, fontWeight: "700", fontFamily: fonts.sans },
  despHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addLink: { color: colors.primary, fontSize: 14, fontWeight: "600", fontFamily: fonts.sans },
  expRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 13 },
  expDesc: { color: colors.text, fontSize: 15, fontWeight: "500", fontFamily: fonts.sans },
  expMeta: { color: colors.textMuted, fontSize: 12.5, fontFamily: fonts.sans, marginTop: 2 },
  expAmt: { color: colors.text, fontSize: 15, fontWeight: "600", fontFamily: fonts.sans },
  emptyDesp: {
    padding: spacing.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyDespTxt: { color: colors.textMuted, fontFamily: fonts.sans },
  hint: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontFamily: fonts.sans,
    textAlign: "center",
    marginTop: spacing.md,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    ...shadow.card,
  },
  fabTxt: { color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: fonts.sans },
});
