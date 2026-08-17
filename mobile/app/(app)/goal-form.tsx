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
import { HugeiconsIcon } from "@hugeicons/react-native";
import { api } from "@/lib/api";
import { Button, Field } from "@/components/ui";
import { CATEGORY_ICONS, keyForIcon } from "@/lib/hugeicons";
import { colors, fonts, radius, spacing } from "@/constants/theme";

const COLORS = [
  "#6366F1",
  "#0A84FF",
  "#FF375F",
  "#8B5CF6",
  "#34C759",
  "#FF9500",
  "#35D6C5",
  "#FFD60A",
  "#40C8E0",
  "#FF7A6B",
];

function tint(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function GoalForm() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    id?: string;
    name?: string;
    icon?: string;
    color?: string;
    target?: string;
    saved?: string;
    monthly?: string;
  }>();
  const isEdit = !!p.id;

  const [name, setName] = useState(p.name ?? "");
  const [target, setTarget] = useState(
    p.target ? String(p.target).replace(".", ",") : "",
  );
  const [saved, setSaved] = useState(
    p.saved ? String(p.saved).replace(".", ",") : "",
  );
  const [monthly, setMonthly] = useState(
    p.monthly ? String(p.monthly).replace(".", ",") : "",
  );
  const [icon, setIcon] = useState(keyForIcon(p.icon) || "flag");
  const [color, setColor] = useState(p.color || COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    const t = parseFloat(target.replace(",", "."));
    if (!name.trim()) return setError("Dá um nome ao objetivo.");
    if (isNaN(t) || t <= 0) return setError("Indica uma meta válida.");
    const s = parseFloat(saved.replace(",", ".")) || 0;
    const m = parseFloat(monthly.replace(",", ".")) || 0;

    setBusy(true);
    try {
      if (isEdit) {
        await api.updateGoal(p.id!, {
          name: name.trim(),
          target: t,
          saved: s,
          monthly: m,
          icon,
          color,
        });
      } else {
        await api.createGoal({
          name: name.trim(),
          target: t,
          saved: s,
          monthly: m,
          icon,
          color,
        });
      }
      router.replace("/(app)/(tabs)");
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
      <Stack.Screen
        options={{ title: isEdit ? "Editar objetivo" : "Novo objetivo" }}
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
          placeholder="Ex.: Fundo de emergência"
        />
        <Field
          label="Meta (€)"
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
          placeholder="5000"
        />
        <Field
          label="Já poupado (€)"
          value={saved}
          onChangeText={setSaved}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Field
          label="Reforço mensal (opcional)"
          value={monthly}
          onChangeText={setMonthly}
          keyboardType="decimal-pad"
          placeholder="150"
        />

        <Text style={styles.label}>Ícone</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORY_ICONS.map((item, i) => {
            const active = item.key === icon;
            const c = COLORS[i % COLORS.length];
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setIcon(item.key);
                  setColor(c);
                }}
                style={[
                  styles.iconChip,
                  active && { backgroundColor: tint(color, 0.16), borderColor: color },
                ]}
              >
                <HugeiconsIcon
                  icon={item.icon as never}
                  size={22}
                  color={active ? color : colors.text}
                  strokeWidth={2}
                />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ height: spacing.sm }} />
        <Button
          label={isEdit ? "Guardar alterações" : "Criar objetivo"}
          onPress={save}
          loading={busy}
        />
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
