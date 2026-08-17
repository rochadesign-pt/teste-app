export const colors = {
  // Tema claro (estilo fintech da referência): fundo cinza muito claro,
  // cards brancos, texto quase preto, acento azul e botões pretos.
  bg: "#F1F3F6",
  surface: "#FFFFFF",
  surfaceAlt: "#F3F5F8",
  border: "#E7EAEF",
  text: "#0E0F13",
  textMuted: "#8A909B",
  primary: "#2F6BF6", // acento azul (links, estados ativos)
  primaryText: "#FFFFFF",
  ink: "#0E0F13", // botões pretos em pílula
  danger: "#EF4444",
  success: "#22C55E",
  lime: "#A3E635", // mantido por compatibilidade; não usado no tema claro

  // Cores de acento por categoria (vivas).
  accents: {
    orange: "#FF9F0A",
    green: "#22C55E",
    blue: "#2F6BF6",
    purple: "#7C5CFF",
    pink: "#FF375F",
    yellow: "#FFCC00",
    teal: "#30C7D6",
  },
};

// Sombras suaves reutilizáveis (web → boxShadow; nativo → elevation).
export const shadow = {
  card: {
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  soft: {
    shadowColor: "#0B1220",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
};
