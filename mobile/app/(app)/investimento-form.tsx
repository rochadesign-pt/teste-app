import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { Button, Field } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";

const ICONS = ["📈", "🏦", "🪙", "🏠", "💎", "🚀", "🌱", "⚡️", "🛡️", "🎯"];
const COLORS = [
  "#35D6C5",
  "#34C759",
  "#FFD60A",
  "#FF9500",
  "#0A84FF",
  "#8B5CF6",
  "#34C759",
  "#FF375F",
  "#6366F1",
  "#40C8E0",
];

function tint(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
const num = (v: string) => parseFloat(v.replace(",", "."));

export default function InvestimentoForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    initialValue?: string;
    monthlyDeposit?: string;
    annualRate?: string;
    startDate?: string;
    icon?: string;
    color?: string;
  }>();
  const isEdit = !!params.id;

  const [name, setName] = useState(params.name ?? "");
  const [initial, setInitial] = useState(
    params.initialValue ? String(params.initialValue).replace(".", ",") : "",
  );
  const [monthly, setMonthly] = useState(
    params.monthlyDeposit ? String(params.monthlyDeposit).replace(".", ",") : "",
  );
  const [rate, setRate] = useState(
    params.annualRate ? String(params.annualRate).replace(".", ",") : "7",
  );
  const [start, setStart] = useState(
    params.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [icon, setIcon] = useState(params.icon || ICONS[0]);
  const [color, setColor] = useState(params.color || COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setError(null);
    if (!name.trim()) return setError("Dá um nome ao investimento.");
    const iv = num(initial);
    const md = num(monthly);
    const ar = num(rate);
    if (isNaN(iv) && isNaN(md))
      return setError("Indica um capital inicial ou um depósito mensal.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start))
      return setError("A data tem de estar no formato AAAA-MM-DD.");
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        initialValue: isNaN(iv) ? 0 : iv,
        monthlyDeposit: isNaN(md) ? 0 : md,
        annualRate: isNaN(ar) ? 0 : ar,
        startDate: start,
        icon,
        color,
      };
      if (isEdit) await api.updateInvestment(params.id!, payload);
      else await api.createInvestment(payload);
      router.back();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteInvestment(params.id!);
      router.back();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Stack.Screen
        options={{ title: isEdit ? "Editar investimento" : "Novo investimento" }}
      />
      <ScrollView contentContainerStyle={styles.form}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <Field
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: ETF Mundo, PPR, Cripto…"
        />
        <Field
          label="Capital inicial (€)"
          value={initial}
          onChangeText={setInitial}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />
        <Field
          label="Depósito mensal (€)"
          value={monthly}
          onChangeText={setMonthly}
          keyboardType="decimal-pad"
          placeholder="100,00"
        />
        <Field
          label="Retorno anual esperado (%)"
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          placeholder="7"
        />
        <Field
          label="Investe desde (data)"
          value={start}
          onChangeText={setStart}
          placeholder="AAAA-MM-DD"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Ícone</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {ICONS.map((ic, i) => {
            const active = ic === icon;
            return (
              <Pressable
                key={ic + i}
                onPress={() => {
                  setIcon(ic);
                  setColor(COLORS[i]);
                }}
                style={[
                  styles.iconChip,
                  active && {
                    backgroundColor: tint(COLORS[i], 0.16),
                    borderColor: COLORS[i],
                  },
                ]}
              >
                <Text style={{ fontSize: 18 }}>{ic}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ height: spacing.sm }} />
        <Button
          label={isEdit ? "Guardar alterações" : "Adicionar investimento"}
          onPress={save}
          loading={busy}
        />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
        {isEdit &&
          (confirmDelete ? (
            <Button label="Confirmar eliminação" variant="danger" onPress={remove} />
          ) : (
            <Button
              label="Apagar investimento"
              variant="ghost"
              onPress={() => setConfirmDelete(true)}
            />
          ))}
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
  chips: { gap: spacing.sm, paddingVertical: 2 },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    backgroundColor: "rgba(255,69,58,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
});
