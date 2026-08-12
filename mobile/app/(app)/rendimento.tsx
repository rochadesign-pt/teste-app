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
import { Button, Field } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";

export default function Rendimento() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => setValue(p.monthlyIncome ? String(p.monthlyIncome).replace(".", ",") : ""))
      .catch(() => setValue(""))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setError(null);
    const n = parseFloat(value.replace(",", ".")) || 0;
    if (n < 0) return setError("Indica um valor válido.");
    setBusy(true);
    try {
      await api.updateProfile({ monthlyIncome: n });
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
          Define quanto recebes por mês (salário líquido ou rendimento médio).
          Serve para a Análise do mês saber quanto estás mesmo a poupar.
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
              label="Rendimento mensal (€)"
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder="1200,00"
            />
            <View style={{ height: spacing.sm }} />
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
  errorBox: {
    backgroundColor: "rgba(255,69,58,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
});
