import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { Ring } from "@/components/charts";
import { Button, Field } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

export default function GoalDetail() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    id: string;
    name?: string;
    icon?: string;
    color?: string;
    target?: string;
    saved?: string;
    monthly?: string;
  }>();
  const id = p.id;
  const name = p.name ?? "Objetivo";
  const icon = p.icon || "🎯";
  const color = p.color || colors.primary;
  const target = Number(p.target) || 0;
  const monthly = Number(p.monthly) || 0;

  const [saved, setSaved] = useState(Number(p.saved) || 0);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pct = target > 0 ? Math.min(1, saved / target) : 0;
  const left = Math.max(0, target - saved);

  const add = async (v: number) => {
    if (!v || v <= 0) return;
    setError(null);
    setBusy(true);
    try {
      const g = await api.updateGoal(id, { addSaved: v });
      setSaved(g.saved);
      setAmount("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteGoal(id);
      router.back();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const eta =
    left <= 0
      ? "Objetivo concluído! 🎉"
      : monthly > 0
        ? `~${Math.ceil(left / monthly)} meses a poupar ${formatMoney(monthly)}/mês`
        : `Faltam ${formatMoney(left)}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: name }} />

      <View style={styles.ringWrap}>
        <Ring size={120} stroke={9} progress={pct} color={color} glow />
        <View style={styles.ringCenter}>
          <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>
        </View>
      </View>

      <Text style={styles.name}>
        {icon} {name}
      </Text>
      <Text style={styles.sub}>
        {formatMoney(saved)} de {formatMoney(target)}
      </Text>
      <Text style={styles.eta}>{eta}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Adicionar poupança</Text>
      <View style={styles.quick}>
        {[50, 100, 250].map((v) => (
          <Pressable
            key={v}
            style={styles.chip}
            disabled={busy}
            onPress={() => add(v)}
          >
            <Text style={styles.chipText}>+ {formatMoney(v)}</Text>
          </Pressable>
        ))}
      </View>
      <Field
        label=""
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="Outro valor"
      />
      <Button
        label="Adicionar"
        loading={busy}
        onPress={() => add(parseFloat(amount.replace(",", ".")))}
      />

      <View style={{ height: spacing.md }} />
      <Button
        label="Editar objetivo"
        variant="ghost"
        onPress={() =>
          router.replace({
            pathname: "/(app)/goal-form",
            params: { id, name, icon, color, target: String(target), saved: String(saved), monthly: String(monthly) },
          })
        }
      />
      {confirmDelete ? (
        <Button label="Confirmar eliminação" variant="danger" onPress={remove} />
      ) : (
        <Button
          label="Apagar objetivo"
          variant="ghost"
          onPress={() => setConfirmDelete(true)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, alignItems: "center", gap: spacing.sm },
  ringWrap: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  ringCenter: {
    position: "absolute",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  pct: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "500",
    fontFamily: fonts.sans,
    marginTop: spacing.sm,
  },
  sub: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.sans },
  eta: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  error: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
  label: {
    alignSelf: "flex-start",
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: fonts.sans,
    marginTop: spacing.lg,
  },
  quick: { flexDirection: "row", gap: spacing.sm, alignSelf: "stretch" },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.sans },
});
