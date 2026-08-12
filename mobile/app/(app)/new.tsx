import { useEffect, useState } from "react";
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
import { api, type Category } from "@/lib/api";
import { Button, Field } from "@/components/ui";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function ExpenseForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    amount?: string;
    date?: string;
    note?: string;
    categoryId?: string;
  }>();
  const isEdit = !!params.id;

  const [title, setTitle] = useState(params.title ?? "");
  const [amount, setAmount] = useState(
    params.amount ? String(params.amount).replace(".", ",") : "",
  );
  const [date, setDate] = useState(
    params.date ?? new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState(params.note ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    params.categoryId ? String(params.categoryId) : null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const remove = async () => {
    setSaving(true);
    try {
      await api.deleteExpense(params.id!);
      router.back();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  useEffect(() => {
    // Resiliente: se a função de categorias ainda não estiver no ar,
    // simplesmente não mostramos categorias (a despesa guarda na mesma).
    api
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const handleSave = async () => {
    setError(null);
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!title.trim()) return setError("Dá um nome à despesa.");
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return setError("Indica um valor válido.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      return setError("A data tem de estar no formato AAAA-MM-DD.");

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
        categoryId: categoryId ?? undefined,
      };
      if (isEdit) await api.updateExpense(params.id!, payload);
      else await api.createExpense(payload);
      router.back();
    } catch (err) {
      setError((err as Error).message || "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Stack.Screen
        options={{ title: isEdit ? "Editar despesa" : "Nova despesa" }}
      />
      <ScrollView contentContainerStyle={styles.form}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Field
          label="Descrição"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: Almoço, Combustível…"
        />
        <Field
          label="Valor (€)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />

        {categories.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={styles.label}>Categoria</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip
                label="Nenhuma"
                icon="∅"
                color={colors.textMuted}
                active={categoryId === null}
                onPress={() => setCategoryId(null)}
              />
              {categories.map((c) => (
                <Chip
                  key={c._id}
                  label={c.name}
                  icon={c.icon ?? "💸"}
                  color={c.color ?? colors.primary}
                  active={categoryId === c._id}
                  onPress={() => setCategoryId(c._id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <Field
          label="Data"
          value={date}
          onChangeText={setDate}
          placeholder="AAAA-MM-DD"
          autoCapitalize="none"
        />
        <Field
          label="Nota (opcional)"
          value={note}
          onChangeText={setNote}
          placeholder="Detalhes adicionais"
          multiline
        />

        <View style={{ height: spacing.sm }} />
        <Button
          label={isEdit ? "Guardar alterações" : "Guardar despesa"}
          onPress={handleSave}
          loading={saving}
        />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
        {isEdit &&
          (confirmDelete ? (
            <Button
              label="Confirmar eliminação"
              variant="danger"
              onPress={remove}
            />
          ) : (
            <Button
              label="Apagar despesa"
              variant="ghost"
              onPress={() => setConfirmDelete(true)}
            />
          ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({
  label,
  icon,
  color,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: tint(color, 0.16), borderColor: color },
      ]}
    >
      <CategoryGlyph icon={icon} size={17} color={active ? color : colors.text} />
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
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
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.sans },
  errorBox: {
    backgroundColor: "rgba(255,69,58,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
});
