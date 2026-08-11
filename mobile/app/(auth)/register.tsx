import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Field } from "@/components/ui";
import { colors, radius, spacing } from "@/constants/theme";

export default function Register() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError("Preenche o email e a palavra-passe.");
      return;
    }
    if (password.length < 6) {
      setError("A palavra-passe precisa de pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password);
      if (needsConfirmation) {
        setInfo(
          "Conta criada. Confirma o email na tua caixa de entrada e depois entra.",
        );
      }
      // Se não precisar de confirmação, o guard entra automaticamente.
    } catch (err) {
      setError((err as Error).message || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Os teus dados ficam associados só a ti.
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {info && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{info}</Text>
            </View>
          )}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@exemplo.com"
          />
          <Field
            label="Palavra-passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
          />
          <Button
            label="Criar conta"
            onPress={handleRegister}
            loading={loading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tens conta? </Text>
          <Link href="/(auth)/login" style={styles.footerLink}>
            Entrar
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, padding: spacing.lg, justifyContent: "center" },
  header: { marginBottom: spacing.xl, gap: spacing.xs },
  title: { color: colors.text, fontSize: 28, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 15 },
  form: { gap: spacing.md },
  errorBox: {
    backgroundColor: "rgba(255,69,58,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,69,58,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 14 },
  infoBox: {
    backgroundColor: "rgba(52,199,89,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,199,89,0.28)",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoText: { color: colors.success, fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: { color: colors.textMuted },
  footerLink: { color: colors.primary, fontWeight: "600" },
});
