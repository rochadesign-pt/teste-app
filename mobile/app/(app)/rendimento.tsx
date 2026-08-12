import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Button, Field } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";

const parse = (v: string) => parseFloat(v.replace(",", ".")) || 0;

export default function Rendimento() {
  const router = useRouter();
  const [salary, setSalary] = useState("");
  const [meal, setMeal] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        setSalary(p.monthlyIncome ? String(p.monthlyIncome).replace(".", ",") : "");
        setMeal(p.mealAllowance ? String(p.mealAllowance).replace(".", ",") : "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = parse(salary) + parse(meal);

  const save = async () => {
    setError(null);
    const s = parse(salary);
    const m = parse(meal);
    if (s < 0 || m < 0) return setError("Indica valores válidos.");
    setBusy(true);
    try {
      await api.updateProfile({ monthlyIncome: s, mealAllowance: m });
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
      <Stack.Screen options={{ title: "Rendimento mensal" }} />
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.intro}>
          Define o que entra por mês. O subsídio de alimentação conta como
          rendimento real — assim a Análise do mês sabe exatamente quanto
          estás a poupar.
        </Text>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : (
          <>
            <Field
              label="Salário líquido (€)"
              value={salary}
              onChangeText={setSalary}
              keyboardType="decimal-pad"
              placeholder="1200,00"
            />
            <Field
              label="Subsídio de alimentação (€/mês)"
              value={meal}
              onChangeText={setMeal}
              keyboardType="decimal-pad"
              placeholder="Ex.: 176,00"
            />

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Rendimento total</Text>
              <Text style={styles.totalValue}>{formatMoney(total)}</Text>
            </View>

            <View style={{ height: spacing.xs }} />
            <Button label="Guardar" onPress={save} loading={busy} />
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={() => router.back()}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: spacing.lg, gap: spacing.md },
  intro: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.sans,
    lineHeight: 20,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  totalLabel: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.sans },
  totalValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.4,
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
