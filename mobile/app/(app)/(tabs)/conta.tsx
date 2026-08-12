import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui";
import { GlassCard } from "@/components/GlassCard";
import { Aura } from "@/components/Aura";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export default function Conta() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const email = session?.user?.email ?? "—";
  const initial = email.charAt(0).toUpperCase();
  const [income, setIncome] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .getProfile()
        .then((p) => setIncome((p.monthlyIncome || 0) + (p.mealAllowance || 0)))
        .catch(() => setIncome(0));
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Aura height={260} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Conta</Text>

        {/* Perfil */}
        <GlassCard contentStyle={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.sub}>Sessão ativa</Text>
          </View>
        </GlassCard>

        {/* Finanças */}
        <Text style={styles.groupTitle}>Finanças</Text>
        <GlassCard contentStyle={styles.group}>
          <Row
            icon="wallet"
            label="Rendimento mensal"
            value={
              income === null
                ? "…"
                : income > 0
                  ? formatMoney(income)
                  : "Definir"
            }
            onPress={() => router.push("/(app)/rendimento")}
          />
        </GlassCard>

        {/* Segurança */}
        <Text style={styles.groupTitle}>Segurança</Text>
        <GlassCard contentStyle={styles.group}>
          <Row icon="lock-closed" label="Dados encriptados em trânsito (HTTPS)" />
          <View style={styles.divider} />
          <Row icon="shield-checkmark" label="Base de dados privada" />
          <View style={styles.divider} />
          <Row icon="person" label="Dados isolados por utilizador" />
        </GlassCard>

        {/* Sobre */}
        <Text style={styles.groupTitle}>Sobre</Text>
        <GlassCard contentStyle={styles.group}>
          <Row icon="pricetag" label="Versão" value="1.0.0" />
          <View style={styles.divider} />
          <Row icon="server" label="Dados" value="Sanity + Supabase" />
        </GlassCard>

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
  group: {},
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
