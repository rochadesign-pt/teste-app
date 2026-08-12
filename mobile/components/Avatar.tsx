import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, fonts } from "@/constants/theme";

/**
 * Abre a galeria e devolve a foto escolhida como data URI (persiste em
 * localStorage/SecureStore, ao contrário de um blob: URL que morre no reload).
 */
export async function pickPhoto(): Promise<string | null> {
  try {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  } catch {
    /* na web não há permissão a pedir */
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri;
}

export function Avatar({
  uri,
  name,
  size = 48,
  onChange,
  onPress,
}: {
  uri?: string | null;
  name?: string;
  size?: number;
  onChange?: (uri: string) => void;
  onPress?: () => void;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const handle = async () => {
    if (onPress) return onPress();
    const picked = await pickPhoto();
    if (picked) onChange?.(picked);
  };
  return (
    <Pressable onPress={handle} hitSlop={6}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.16)",
          }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
            {initial}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.16)",
  },
  initial: { color: "#fff", fontWeight: "600", fontFamily: fonts.sans },
});
