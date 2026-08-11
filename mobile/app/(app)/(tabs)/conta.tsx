import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
  );
}

export default function Conta() {
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? "—";
  const initial = email.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Conta</Text>

        {/* Perfil */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.sub}>Sessão ativa</Text>
          </View>
        </View>

        {/* Segurança */}
        <Text style={styles.groupTitle}>Segurança</Text>
        <View style={styles.group}>
          <Row icon="lock-closed" label="Dados encriptados em trânsito (HTTPS)" />
          <View style={styles.divider} />
          <Row icon="shield-checkmark" label="Base de dados privada" />
          <View style={styles.divider} />
          <Row icon="person" label="Dados isolados por utilizador" />
        </View>

        {/* Sobre */}
        <Text style={styles.groupTitle}>Sobre</Text>
        <View style={styles.group}>
          <Row icon="pricetag" label="Versão" value="1.0.0" />
          <View style={styles.divider} />
          <Row icon="server" label="Dados" value="Sanity + Supabase" />
        </View>

        <View style={{ height: spacing.lg }} />
        <Button label="Terminar sessão" variant="danger" onPress={() => signOut()} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  h1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: fonts.sans,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  email: { color: colors.text, fontSize: 16, fontWeight: "500", fontFamily: fonts.sans },
  sub: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans, marginTop: 2 },
  groupTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.sans,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  rowIcon: { width: 24, alignItems: "center" },
  rowLabel: { color: colors.text, fontSize: 15, fontFamily: fonts.sans, flex: 1 },
  rowValue: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.sans },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
});
