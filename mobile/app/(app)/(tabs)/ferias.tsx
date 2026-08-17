import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { api, type Trip } from "@/lib/api";
import { tripStats } from "@/lib/split";
import { formatMoney } from "@/lib/format";
import { colors, fonts, shadow, spacing } from "@/constants/theme";

export default function Ferias() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.listTrips().then((t) => {
        setTrips(t);
        setLoaded(true);
      });
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.head}>
        <View>
          <Text style={styles.h1}>Férias</Text>
          <Text style={styles.sub}>Despesas partilhadas com amigos</Text>
        </View>
        <Pressable
          style={styles.newBtn}
          onPress={() => router.push("/(app)/grupo-form")}
        >
          <Text style={styles.newBtnTxt}>+ Nova</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {trips.map((trip) => {
          const s = tripStats(trip);
          return (
            <Pressable
              key={trip._id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/(app)/grupo", params: { id: trip._id } })
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.emojiWrap}>
                  <Text style={styles.emoji}>{trip.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {trip.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {trip.members.length}{" "}
                    {trip.members.length === 1 ? "pessoa" : "pessoas"} ·{" "}
                    {trip.expenses.length}{" "}
                    {trip.expenses.length === 1 ? "despesa" : "despesas"}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFoot}>
                <View>
                  <Text style={styles.footK}>Total</Text>
                  <Text style={styles.footTotal}>
                    {formatMoney(s.total, trip.currency)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.footK}>Por pessoa</Text>
                  <Text style={styles.footHead}>
                    {formatMoney(s.perHead, trip.currency)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        {loaded && trips.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏖️</Text>
            <Text style={styles.emptyTitle}>Ainda sem viagens</Text>
            <Text style={styles.emptyText}>
              Cria um grupo, adiciona os amigos e regista as despesas. No fim,
              vês quanto cada um deve.
            </Text>
            <Pressable
              style={styles.emptyCta}
              onPress={() => router.push("/(app)/grupo-form")}
            >
              <Text style={styles.emptyCtaTxt}>+ Criar primeira viagem</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  h1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.8,
  },
  sub: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans, marginTop: 2 },
  newBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  newBtnTxt: { color: "#fff", fontWeight: "600", fontFamily: fonts.sans, fontSize: 14 },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 130 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    ...shadow.card,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 24 },
  cardName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.3,
  },
  cardMeta: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans, marginTop: 2 },
  cardFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footK: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.sans },
  footTotal: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  footHead: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  empty: { alignItems: "center", marginTop: spacing.xl * 1.5, paddingHorizontal: spacing.lg },
  emptyEmoji: { fontSize: 44, marginBottom: spacing.sm },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14.5,
    fontFamily: fonts.sans,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 6,
  },
  emptyCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.ink,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
  },
  emptyCtaTxt: { color: "#fff", fontWeight: "600", fontFamily: fonts.sans, fontSize: 15 },
});
