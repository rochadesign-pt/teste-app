import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { Button, Field } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";

export default function NewExpense() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!title.trim()) {
      Alert.alert("Atenção", "Dá um nome à despesa.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Atenção", "Indica um valor válido.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Atenção", "A data tem de estar no formato AAAA-MM-DD.");
      return;
    }

    setSaving(true);
    try {
      await api.createExpense({
        title: title.trim(),
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert("Erro ao guardar", (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.form}>
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

        <View style={{ height: spacing.md }} />
        <Button label="Guardar despesa" onPress={handleSave} loading={saving} />
        <Button
          label="Cancelar"
          variant="ghost"
          onPress={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: spacing.lg, gap: spacing.md },
});
