import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { Ring } from "@/components/charts";
import { Slider } from "@/components/Slider";
import { Aura } from "@/components/Aura";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { colors, fonts, radius, spacing } from "@/constants/theme";

function tint(hex: string, a: number) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function lighten(hex: string, a = 0.5) {
  const n = parseInt((hex || "#6366F1").replace("#", ""), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * a);
  return `#${((1 << 24) + (mix((n >> 16) & 255) << 16) + (mix((n >> 8) & 255) << 8) + mix(n & 255)).toString(16).slice(1)}`;
}

export default function GoalDetail() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    id: string;
    name?: string;
    icon?: string;
    color?: string;
    target?: string;
    saved?: string;
    monthly?: string;
  }>();
  const id = p.id;
  const name = p.name ?? "Objetivo";
  const icon = p.icon || "🎯";
  const color = p.color || colors.primary;
  const target = Number(p.target) || 0;
  const monthly = Number(p.monthly) || 0;

  const [saved, setSaved] = useState(Number(p.saved) || 0);
  const [slideAmt, setSlideAmt] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pct = target > 0 ? Math.min(1, saved / target) : 0;
  const left = Math.max(0, target - saved);
  const sliderMax = Math.max(50, Math.ceil(left / 10) * 10);
  const amt = Math.min(slideAmt, sliderMax);

  const add = async (v: number) => {
    if (!v || v <= 0) return;
    setError(null);
    setBusy(true);
    try {
      const g = await api.updateGoal(id, { addSaved: v });
      setSaved(g.saved);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteGoal(id);
      router.back();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const eta =
    left <= 0
      ? "Objetivo concluído! 🎉"
      : monthly > 0
        ? `~${Math.ceil(left / monthly)} meses a poupar ${formatMoney(monthly)}/mês`
        : `Faltam ${formatMoney(left)}`;

  return (
    <View style={styles.container}>
      <Aura
        height={300}
        a={tint(color, 0.3)}
        b={tint(color, 0.14)}
        wash={tint(color, 0.08)}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: name }} />

        <View style={styles.ringWrap}>
          <Ring size={120} stroke={9} progress={pct} color={color} glow />
          <View style={styles.ringCenter}>
            <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>
          </View>
        </View>

        <Text style={styles.name}>
          {icon} {name}
        </Text>
        <Text style={styles.sub}>
          {formatMoney(saved)} de {formatMoney(target)}
        </Text>
        <Text style={styles.eta}>{eta}</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>Adicionar poupança</Text>
        <View style={styles.quick}>
          {[50, 100, 250].map((v) => (
            <Pressable
              key={v}
              style={styles.chip}
              disabled={busy}
              onPress={() => add(v)}
            >
              <Text style={styles.chipText}>+ {formatMoney(v)}</Text>
            </Pressable>
          ))}
        </View>

        {left > 0 && (
          <View style={styles.sliderBlock}>
            <View style={styles.sliderHead}>
              <Text style={styles.sliderCaption}>Ou arrasta um valor</Text>
              <Text style={[styles.sliderValue, { color }]}>{formatMoney(amt)}</Text>
            </View>
            <Slider
              value={amt}
              min={0}
              max={sliderMax}
              step={5}
              onChange={setSlideAmt}
              from={lighten(color)}
              to={color}
            />
          </View>
        )}
        <Button
          label={amt > 0 ? `Adicionar ${formatMoney(amt)}` : "Adicionar"}
          loading={busy}
          onPress={() => add(amt)}
        />

        <View style={{ height: spacing.md }} />
      <Button
        label="Editar objetivo"
        variant="ghost"
        onPress={() =>
          router.replace({
            pathname: "/(app)/goal-form",
            params: { id, name, icon, color, target: String(target), saved: String(saved), monthly: String(monthly) },
          })
        }
      />
        {confirmDelete ? (
          <Button label="Confirmar eliminação" variant="danger" onPress={remove} />
        ) : (
          <Button
            label="Apagar objetivo"
            variant="ghost"
            onPress={() => setConfirmDelete(true)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, alignItems: "center", gap: spacing.sm },
  ringWrap: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  ringCenter: {
    position: "absolute",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  pct: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "600",
    fontFamily: fonts.sans,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "500",
    fontFamily: fonts.sans,
    marginTop: spacing.sm,
  },
  sub: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.sans },
  eta: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.sans },
  error: { color: colors.danger, fontSize: 14, fontFamily: fonts.sans },
  label: {
    alignSelf: "flex-start",
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: fonts.sans,
    marginTop: spacing.lg,
  },
  sliderBlock: { alignSelf: "stretch", marginTop: spacing.xs, gap: 4 },
  sliderHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sliderCaption: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.sans,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: fonts.sans,
    letterSpacing: -0.3,
  },
  quick: { flexDirection: "row", gap: spacing.sm, alignSelf: "stretch" },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  chipText: { color: colors.text, fontSize: 14, fontFamily: fonts.sans },
});
