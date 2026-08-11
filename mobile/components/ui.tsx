import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  StyleSheet,
  View,
} from "react-native";
import { colors, radius, spacing } from "@/constants/theme";

export function Button({
  label,
  onPress,
  loading,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
}) {
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.danger
        : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed || loading ? 0.7 : 1 },
        variant === "ghost" && styles.buttonGhost,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "ghost" && { color: colors.primary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
});
