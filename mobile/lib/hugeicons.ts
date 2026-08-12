// Importes por-ícone (deep imports): garantem tree-shaking. O barrel
// "@hugeicons/core-free-icons" arrasta as ~4000 ícones (≈6MB) para o bundle.
import Home07Icon from "@hugeicons/core-free-icons/Home07Icon";
import ShoppingCart01Icon from "@hugeicons/core-free-icons/ShoppingCart01Icon";
import ShoppingBasket02Icon from "@hugeicons/core-free-icons/ShoppingBasket02Icon";
import Restaurant02Icon from "@hugeicons/core-free-icons/Restaurant02Icon";
import Car05Icon from "@hugeicons/core-free-icons/Car05Icon";
import Bus01Icon from "@hugeicons/core-free-icons/Bus01Icon";
import Airplane02Icon from "@hugeicons/core-free-icons/Airplane02Icon";
import Beach02Icon from "@hugeicons/core-free-icons/Beach02Icon";
import Shield01Icon from "@hugeicons/core-free-icons/Shield01Icon";
import EnergyIcon from "@hugeicons/core-free-icons/EnergyIcon";
import DropletIcon from "@hugeicons/core-free-icons/DropletIcon";
import SmartPhone01Icon from "@hugeicons/core-free-icons/SmartPhone01Icon";
import Shirt01Icon from "@hugeicons/core-free-icons/Shirt01Icon";
import Dumbbell01Icon from "@hugeicons/core-free-icons/Dumbbell01Icon";
import Coffee01Icon from "@hugeicons/core-free-icons/Coffee01Icon";
import GiftIcon from "@hugeicons/core-free-icons/GiftIcon";
import Medicine01Icon from "@hugeicons/core-free-icons/Medicine01Icon";
import Book02Icon from "@hugeicons/core-free-icons/Book02Icon";
import GameController01Icon from "@hugeicons/core-free-icons/GameController01Icon";
import Film01Icon from "@hugeicons/core-free-icons/Film01Icon";
import MusicNote01Icon from "@hugeicons/core-free-icons/MusicNote01Icon";
import LaptopIcon from "@hugeicons/core-free-icons/LaptopIcon";
import Tv01Icon from "@hugeicons/core-free-icons/Tv01Icon";
import FootballIcon from "@hugeicons/core-free-icons/FootballIcon";
import Leaf01Icon from "@hugeicons/core-free-icons/Leaf01Icon";
import Invoice01Icon from "@hugeicons/core-free-icons/Invoice01Icon";
import CashIcon from "@hugeicons/core-free-icons/Cash01Icon";
import Analytics01Icon from "@hugeicons/core-free-icons/Analytics01Icon";
import Rocket01Icon from "@hugeicons/core-free-icons/Rocket01Icon";
import Diamond01Icon from "@hugeicons/core-free-icons/Diamond01Icon";
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon";
import BankIcon from "@hugeicons/core-free-icons/BankIcon";
import HeartIcon from "@hugeicons/core-free-icons/HeartIcon";

// Conjunto curado para o seletor. `key` é o que se guarda na categoria.
export const CATEGORY_ICONS: { key: string; icon: unknown }[] = [
  { key: "home", icon: Home07Icon },
  { key: "cart", icon: ShoppingCart01Icon },
  { key: "basket", icon: ShoppingBasket02Icon },
  { key: "restaurant", icon: Restaurant02Icon },
  { key: "car", icon: Car05Icon },
  { key: "bus", icon: Bus01Icon },
  { key: "airplane", icon: Airplane02Icon },
  { key: "beach", icon: Beach02Icon },
  { key: "shield", icon: Shield01Icon },
  { key: "energy", icon: EnergyIcon },
  { key: "water", icon: DropletIcon },
  { key: "phone", icon: SmartPhone01Icon },
  { key: "shirt", icon: Shirt01Icon },
  { key: "gym", icon: Dumbbell01Icon },
  { key: "coffee", icon: Coffee01Icon },
  { key: "gift", icon: GiftIcon },
  { key: "health", icon: Medicine01Icon },
  { key: "book", icon: Book02Icon },
  { key: "game", icon: GameController01Icon },
  { key: "film", icon: Film01Icon },
  { key: "music", icon: MusicNote01Icon },
  { key: "laptop", icon: LaptopIcon },
  { key: "tv", icon: Tv01Icon },
  { key: "football", icon: FootballIcon },
  { key: "leaf", icon: Leaf01Icon },
  { key: "receipt", icon: Invoice01Icon },
  { key: "cash", icon: CashIcon },
  { key: "chart", icon: Analytics01Icon },
  { key: "rocket", icon: Rocket01Icon },
  { key: "diamond", icon: Diamond01Icon },
  { key: "flag", icon: Flag02Icon },
  { key: "bank", icon: BankIcon },
  { key: "heart", icon: HeartIcon },
];

const BY_KEY: Record<string, unknown> = Object.fromEntries(
  CATEGORY_ICONS.map((i) => [i.key, i.icon]),
);

// Emojis antigos → key
const EMOJI_KEY: Record<string, string> = {
  "🏠": "home", "🏡": "home", "🛒": "cart", "🛍️": "basket",
  "🍴": "restaurant", "🍽️": "restaurant", "🍕": "restaurant", "🍔": "restaurant", "🥗": "restaurant",
  "🚗": "car", "🚙": "car", "🚕": "car", "⛽": "car", "⛽️": "car",
  "🚌": "bus", "🚆": "bus", "🚇": "bus",
  "✈️": "airplane", "🏖️": "beach", "⛱️": "beach", "🏝️": "beach", "🌊": "water",
  "🛟": "shield", "🛡️": "shield",
  "💡": "energy", "⚡": "energy", "⚡️": "energy", "💧": "water", "🚿": "water",
  "📱": "phone", "☎️": "phone", "📞": "phone", "📶": "energy",
  "👕": "shirt", "👗": "shirt", "💪": "gym", "🏋️": "gym", "🏃": "gym",
  "☕": "coffee", "☕️": "coffee", "🍺": "coffee", "🍷": "coffee",
  "🎁": "gift", "💊": "health", "🏥": "health", "🩺": "health",
  "🎓": "book", "📚": "book", "📖": "book",
  "🐾": "health", "🐶": "health", "🐱": "health",
  "🎮": "game", "🎬": "film", "🎥": "film", "🍿": "film",
  "🎵": "music", "🎶": "music", "🎧": "music",
  "💻": "laptop", "📺": "tv",
  "⚽": "football", "🏀": "football",
  "🌱": "leaf", "🌳": "leaf",
  "🧾": "receipt", "📝": "receipt",
  "💰": "cash", "💵": "cash", "💳": "cash",
  "📈": "chart", "📊": "chart",
  "🚀": "rocket", "💎": "diamond", "🎯": "flag", "🏆": "flag", "⭐": "flag",
  "🏦": "bank", "🌍": "bank", "❤️": "heart",
};

// Nomes Ionicons do seletor anterior → key
const IONICON_KEY: Record<string, string> = {
  "home-outline": "home", "cart-outline": "cart", "bag-handle-outline": "basket",
  "restaurant-outline": "restaurant", "fast-food-outline": "restaurant",
  "car-outline": "car", "bus-outline": "bus", "airplane-outline": "airplane",
  "umbrella-outline": "beach", "flash-outline": "energy", "water-outline": "water",
  "wifi-outline": "energy", "phone-portrait-outline": "phone", "shirt-outline": "shirt",
  "fitness-outline": "gym", "cafe-outline": "coffee", "gift-outline": "gift",
  "medkit-outline": "health", "school-outline": "book", "book-outline": "book",
  "paw-outline": "health", "game-controller-outline": "game", "card-outline": "cash",
  "musical-notes-outline": "music",
};

/** Devolve a `key` semântica para um ícone guardado (key/emoji/nome antigo). */
export function keyForIcon(icon?: string): string | null {
  const name = (icon ?? "").trim();
  if (!name) return null;
  if (BY_KEY[name]) return name;
  return EMOJI_KEY[name] ?? IONICON_KEY[name] ?? null;
}

/** Devolve o objeto de ícone Hugeicons a desenhar, ou null. */
export function resolveHugeicon(icon?: string): unknown | null {
  const k = keyForIcon(icon);
  return k ? BY_KEY[k] : null;
}
