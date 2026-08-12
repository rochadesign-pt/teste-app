export const colors = {
  // Base neutra quase preta (estilo da referência).
  bg: "#0A0A0B",
  surface: "#161618",
  surfaceAlt: "#202023",
  border: "#2A2A2E",
  text: "#F5F5F7",
  textMuted: "#8E8E93",
  primary: "#6366F1",
  primaryText: "#FFFFFF",
  danger: "#FF453A",
  success: "#34C759",
  lime: "#A3E635",

  // Cores de acento por categoria (vivas, estilo iOS).
  accents: {
    orange: "#FF9500",
    green: "#34C759",
    blue: "#0A84FF",
    purple: "#8B5CF6",
    pink: "#FF375F",
    yellow: "#FFD60A",
    teal: "#40C8E0",
  },
};

// Na web usamos a Geist (carregada em app/+html.tsx). Em nativo cai no
// tipo de letra do sistema.
export const fonts = {
  sans: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 24,
};
