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
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { Button, Field } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";

const ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "home-outline", "cart-outline", "restaurant-outline", "car-outline",
  "bus-outline", "airplane-outline", "flash-outline", "water-outline",
  "wifi-outline", "phone-portrait-outline", "shirt-outline", "fitness-outline",
  "cafe-outline", "fast-food-outline", "gift-outline", "medkit-outline",
  "school-outline", "paw-outline", "game-controller-outline", "card-outline",
  "umbrella-outline", "book-outline", "musical-notes-outline", "bag-handle-outline",
];
const COLORS = [
  "#0A84FF", "#FF9500", "#35D6C5", "#FF375F", "#8B5CF6",
  "#34C759", "#FFD60A", "#40C8E0", "#6366F1", "#FF7A6B",
];

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function CategoriaForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    icon?: string;
    color?: string;
    budget?: string;
  }>();
  const isEdit = !!params.id;

  const [name, setName] = useState(params.name ?? "");
  const [icon, setIcon] = useState(params.icon || ICONS[0]);
  const [color, setColor] = useState(params.color || COLORS[0]);
  const [budget, setBudget] = useState(
    params.budget && Number(params.budget) > 0
      ? String(params.budget).replace(".", ",")
      : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setError(null);
    if (!name.trim()) return setError("Dá um nome à categoria.");
    const b = parseFloat(budget.replace(",", ".")) || 0;
    setBusy(true);
    try {
      const payload = { name: name.trim(), icon, color, budget: b };
      if (isEdit) await api.updateCategory(params.id!, payload);
      else await api.createCategory(payload);
      router.back();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteCategory(params.id!);
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
        options={{ title: isEdit ? "Editar categoria" : "Nova categoria" }}
      />
      <ScrollView contentContainerStyle={styles.form}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Pré-visualização */}
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: color }]}>
            <CategoryGlyph icon={icon} size={30} color="#0A0A0B" />
          </View>
          <Text style={styles.previewName}>{name.trim() || "Categoria"}</Text>
        </View>

        <Field
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Habitação, Alimentação…"
        />
        <Field
          label="Orçamento mensal (€) — opcional"
          value={budget}
          onChangeText={setBudget}
          keyboardType="decimal-pad"
          placeholder="Ex.: 400"
        />

        <Text style={styles.label}>Ícone</Text>
        <View style={styles.grid}>
          {ICONS.map((ic) => {
            const active = ic === icon;
            return (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={[
                  styles.iconChip,
                  active && { backgroundColor: tint(color, 0.18), borderColor: color },
                ]}
              >
                <Ionicons
                  name={ic}
                  size={22}
                  color={active ? color : colors.text}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Cor</Text>
        <View style={styles.grid}>
          {COLORS.map((c) => {
            const active = c === color;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  active && styles.colorDotActive,
                ]}
              />
            );
          })}
        </View>

        <View style={{ height: spacing.sm }} />
        <Button
          label={isEdit ? "Guardar alterações" : "Criar categoria"}
          onPress={save}
          loading={busy}
        />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
        {isEdit &&
          (confirmDelete ? (
            <Button label="Confirmar eliminação" variant="danger" onPress={remove} />
          ) : (
            <Button
              label="Apagar categoria"
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
  preview: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: fonts.sans,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
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
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotActive: { borderColor: "#fff" },
  errorBox: {
    backgroundColor: "rgba(255,69,58,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
});
