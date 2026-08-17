import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, type TripMember } from "@/lib/api";
import { Button, Field } from "@/components/ui";
import { localId } from "@/lib/localStore";
import { colors, fonts, radius, spacing } from "@/constants/theme";

const EMOJIS = ["🏖️", "✈️", "🏝️", "⛰️", "🎿", "🏕️", "🚗", "🍻", "🎉", "🏙️"];

export default function GrupoForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [members, setMembers] = useState<TripMember[]>([
    { id: localId(), name: "Eu" },
  ]);
  const [newMember, setNewMember] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    const n = newMember.trim();
    if (!n) return;
    setMembers((m) => [...m, { id: localId(), name: n }]);
    setNewMember("");
  };
  const removeMember = (id: string) =>
    setMembers((m) => m.filter((x) => x.id !== id));

  const save = async () => {
    setError(null);
    if (!name.trim()) return setError("Dá um nome à viagem.");
    if (members.length < 2)
      return setError("Adiciona pelo menos duas pessoas para dividir.");
    setBusy(true);
    try {
      const trip = await api.createTrip({
        name: name.trim(),
        emoji,
        currency: "EUR",
        members,
      });
      router.replace({ pathname: "/(app)/grupo", params: { id: trip._id } });
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
      <Stack.Screen options={{ title: "Nova viagem" }} />
      <ScrollView contentContainerStyle={styles.form}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.preview}>
          <View style={styles.previewEmoji}>
            <Text style={{ fontSize: 34 }}>{emoji}</Text>
          </View>
          <Text style={styles.previewName}>{name.trim() || "Viagem"}</Text>
        </View>

        <Field
          label="Nome da viagem"
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Algarve 2026, Fim de semana no Porto…"
        />

        <Text style={styles.label}>Emoji</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={[styles.emojiChip, emoji === e && styles.emojiChipActive]}
            >
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Pessoas ({members.length})</Text>
        <View style={styles.members}>
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {m.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.memberName}>{m.name}</Text>
              <Pressable onPress={() => removeMember(m.id)} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              value={newMember}
              onChangeText={setNewMember}
              placeholder="Adicionar pessoa…"
              placeholderTextColor={colors.textMuted}
              style={styles.addInput}
              onSubmitEditing={addMember}
              returnKeyType="done"
            />
            <Pressable style={styles.addBtn} onPress={addMember}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={{ height: spacing.sm }} />
        <Button label="Criar viagem" onPress={save} loading={busy} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: spacing.lg, gap: spacing.md },
  preview: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  previewEmoji: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.surface,
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
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiChipActive: { borderColor: colors.primary, backgroundColor: "#EAF1FF" },
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
  addRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  addInput: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.sans,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
});
