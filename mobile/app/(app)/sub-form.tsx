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
import { Stack, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { Button, Field } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";

const ICONS = ["📺", "🎵", "🏋️", "☁️", "📱", "📰", "🎮", "🚗", "🏠", "💳"];
const COLORS = [
  "#FF375F",
  "#34C759",
  "#FF9500",
  "#0A84FF",
  "#8B5CF6",
  "#35D6C5",
  "#6366F1",
  "#FFD60A",
  "#40C8E0",
  "#FF7A6B",
];

function tint(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function SubForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    const a = parseFloat(amount.replace(",", "."));
    if (!name.trim()) return setError("Dá um nome à recorrência.");
    if (isNaN(a) || a <= 0) return setError("Indica um valor mensal válido.");
    const d = parseInt(day, 10);
    const dueDay = !isNaN(d) && d >= 1 && d <= 31 ? d : undefined;
    setBusy(true);
    try {
      await api.createSubscription({ name: name.trim(), amount: a, icon, color, dueDay });
      router.back();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Stack.Screen options={{ title: "Nova recorrência" }} />
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
          placeholder="Ex.: Netflix, Ginásio…"
        />
        <Field
          label="Valor mensal (€)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="9,99"
        />
        <Field
          label="Dia do débito (opcional)"
          value={day}
          onChangeText={setDay}
          keyboardType="number-pad"
          placeholder="Ex.: 8"
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
                key={ic}
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
        <Button label="Adicionar" onPress={save} loading={busy} />
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
