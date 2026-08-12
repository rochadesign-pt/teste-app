import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Emojis antigos → ícone de linha (Ionicons). Assim as categorias criadas
// antes (com emoji) passam a mostrar ícones de linha automaticamente.
const EMOJI_ICON: Record<string, string> = {
  "🏠": "home-outline", "🏡": "home-outline", "🏘️": "home-outline", "🛋️": "home-outline",
  "🛒": "cart-outline", "🛍️": "bag-handle-outline",
  "🍴": "restaurant-outline", "🍽️": "restaurant-outline", "🍕": "fast-food-outline",
  "🍔": "fast-food-outline", "🍟": "fast-food-outline", "🥗": "restaurant-outline",
  "🚗": "car-outline", "🚙": "car-outline", "🚕": "car-outline", "⛽": "car-sport-outline", "⛽️": "car-sport-outline",
  "🚌": "bus-outline", "🚆": "train-outline", "🚇": "train-outline", "🚲": "bicycle-outline",
  "✈️": "airplane-outline",
  "💡": "bulb-outline", "⚡": "flash-outline", "⚡️": "flash-outline",
  "💧": "water-outline", "🚿": "water-outline",
  "📶": "wifi-outline", "🌐": "globe-outline",
  "📱": "phone-portrait-outline", "☎️": "call-outline", "📞": "call-outline",
  "👕": "shirt-outline", "👗": "shirt-outline",
  "💪": "barbell-outline", "🏋️": "barbell-outline", "🏋️‍♂️": "barbell-outline", "🏃": "fitness-outline",
  "☕": "cafe-outline", "☕️": "cafe-outline",
  "🍺": "beer-outline", "🍻": "beer-outline", "🍷": "wine-outline", "🍸": "wine-outline",
  "🎁": "gift-outline",
  "💊": "medkit-outline", "🏥": "medkit-outline", "🩺": "medkit-outline",
  "🎓": "school-outline", "📚": "book-outline", "📖": "book-outline",
  "🐾": "paw-outline", "🐶": "paw-outline", "🐱": "paw-outline",
  "🎮": "game-controller-outline",
  "💳": "card-outline", "💰": "cash-outline", "💵": "cash-outline", "🏦": "business-outline",
  "🎬": "film-outline", "🎥": "film-outline", "🍿": "film-outline",
  "🏖️": "umbrella-outline", "⛱️": "umbrella-outline", "🏝️": "sunny-outline", "🌊": "water-outline",
  "🎵": "musical-notes-outline", "🎶": "musical-notes-outline", "🎧": "headset-outline",
  "📈": "trending-up-outline", "📊": "stats-chart-outline",
  "❤️": "heart-outline", "💇": "cut-outline", "✂️": "cut-outline", "💅": "sparkles-outline",
  "🔧": "construct-outline", "🛠️": "construct-outline", "🔨": "hammer-outline",
  "📺": "tv-outline", "💻": "laptop-outline",
  "⚽": "football-outline", "🏀": "basketball-outline",
  "🌱": "leaf-outline", "🌳": "leaf-outline",
  "🧾": "receipt-outline", "📝": "document-text-outline",
};

/**
 * Devolve o nome do ícone Ionicons a usar para uma categoria, ou null se
 * deve mostrar como texto/emoji. Aceita já um nome de Ionicon ou um emoji.
 */
export function ioniconFor(icon?: string): keyof typeof Ionicons.glyphMap | null {
  const name = (icon ?? "").trim();
  if (!name) return null;
  if (/^[a-z0-9-]+$/.test(name) && name in (Ionicons.glyphMap as object)) {
    return name as keyof typeof Ionicons.glyphMap;
  }
  const mapped = EMOJI_ICON[name];
  if (mapped && mapped in (Ionicons.glyphMap as object)) {
    return mapped as keyof typeof Ionicons.glyphMap;
  }
  return null;
}

/**
 * Ícone de categoria: desenha o ícone de linha (Ionicons) correspondente;
 * se não houver correspondência, mostra o texto/emoji tal como está.
 */
export function CategoryGlyph({
  icon,
  size,
  color,
}: {
  icon?: string;
  size: number;
  color: string;
}) {
  const ion = ioniconFor(icon);
  if (ion) return <Ionicons name={ion} size={size} color={color} />;
  return (
    <Text style={{ fontSize: size * 0.86, color }}>{(icon ?? "").trim() || "💸"}</Text>
  );
}
