import { useState } from "react";
import {
  Alert,
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
import { colors, spacing } from "@/constants/theme";

export default function Register() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Preenche o email e a palavra-passe.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Atenção", "A palavra-passe precisa de pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        "Conta criada",
        "Se a confirmação por email estiver ativa, verifica a tua caixa de entrada antes de entrar.",
      );
    } catch (err) {
      Alert.alert("Não foi possível criar a conta", (err as Error).message);
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: { color: colors.textMuted },
  footerLink: { color: colors.primary, fontWeight: "600" },
});
