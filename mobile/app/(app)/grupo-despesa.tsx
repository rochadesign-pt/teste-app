import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, type Trip } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Button, Field } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";

export default function GrupoDespesa() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [split, setSplit] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      api.getTrip(id).then((t) => {
        setTrip(t);
        if (t) {
          setPaidBy((p) => p ?? t.members[0]?.id ?? null);
          setSplit((s) => (s.size ? s : new Set(t.members.map((m) => m.id))));
        }
      });
    }, [id]),
  );

  const toggleSplit = (mid: string) =>
    setSplit((prev) => {
      const next = new Set(prev);
      next.has(mid) ? next.delete(mid) : next.add(mid);
      return next;
    });

  const value = parseFloat(amount.replace(",", ".")) || 0;
  const perHead = split.size > 0 ? value / split.size : 0;

  const save = async () => {
    setError(null);
    if (!trip) return;
    if (!desc.trim()) return setError("Descreve a despesa.");
    if (value <= 0) return setError("Indica um valor.");
    if (!paidBy) return setError("Escolhe quem pagou.");
    if (split.size === 0) return setError("Escolhe por quem dividir.");
    setBusy(true);
    try {
      await api.addTripExpense(trip._id, {
        description: desc.trim(),
        amount: value,
        paidBy,
        split: [...split],
        date: new Date().toISOString(),
      });
      router.back();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (!trip) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Stack.Screen options={{ title: "Despesa" }} />
        <Text style={{ color: colors.textMuted, fontFamily: fonts.sans }}>A carregar…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Stack.Screen options={{ title: "Nova despesa" }} />
      <ScrollView contentContainerStyle={styles.form}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Field
          label="Descrição"
          value={desc}
          onChangeText={setDesc}
          placeholder="Ex.: Jantar, Alojamento, Combustível…"
        />
        <Field
          label="Valor (€)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />

        <Text style={styles.label}>Quem pagou</Text>
        <View style={styles.chips}>
          {trip.members.map((m) => {
            const active = paidBy === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setPaidBy(m.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.splitHead}>
          <Text style={styles.label}>Dividir entre ({split.size})</Text>
          {value > 0 && split.size > 0 && (
            <Text style={styles.perHead}>
              {formatMoney(perHead, trip.currency)} cada
            </Text>
          )}
        </View>
        <View style={styles.members}>
          {trip.members.map((m) => {
            const on = split.has(m.id);
            return (
              <Pressable
                key={m.id}
                onPress={() => toggleSplit(m.id)}
                style={styles.memberRow}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {m.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>{m.name}</Text>
                <View style={[styles.check, on && styles.checkOn]}>
                  {on && <Ionicons name="checkmark" size={15} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: spacing.sm }} />
        <Button label="Adicionar despesa" onPress={save} loading={busy} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: spacing.lg, gap: spacing.md },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipTxt: { color: colors.text, fontSize: 14, fontWeight: "500", fontFamily: fonts.sans },
  chipTxtActive: { color: "#fff" },
  splitHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  perHead: { color: colors.primary, fontSize: 13, fontWeight: "600", fontFamily: fonts.sans },
  members: { gap: spacing.sm },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: { color: "#fff", fontWeight: "600", fontFamily: fonts.sans },
  memberName: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.sans },
  check: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
});
