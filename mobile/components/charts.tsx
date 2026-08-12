import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { colors } from "@/constants/theme";

export function Ring({
  size = 60,
  stroke = 4,
  progress,
  color,
  glow = true,
  track = colors.surfaceAlt,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  color: string;
  glow?: boolean;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(progress, 1));
  const offset = c * (1 - p);
  return (
    <Svg width={size} height={size}>
      <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          fill="none"
          // @ts-expect-error web-only prop passa direto para o SVG
          style={glow ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
        />
      </G>
    </Svg>
  );
}

// Curva suave (Catmull-Rom → Bézier) para o traço não ficar "às facadas".
function smooth(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(
      1,
    )}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function Sparkline({
  values,
  width,
  height = 90,
  from = "#A5B4FC",
  to = "#6366F1",
}: {
  values: number[];
  width: number;
  height?: number;
  from?: string;
  to?: string;
}) {
  if (values.length < 2) values = [0, ...values];
  const padY = 12;
  const insetL = 5;
  const insetR = 8;
  const usableW = width - insetL - insetR;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => insetL + (i / (values.length - 1)) * usableW;
  const y = (v: number) =>
    height - padY - ((v - min) / span) * (height - padY * 2);
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
  const line = smooth(pts);
  const area = `${line} L ${x(values.length - 1).toFixed(1)} ${height} L ${insetL} ${height} Z`;
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);
  // IDs únicos por cor — senão os gradientes SVG colidem entre instâncias
  // na mesma página (todos os gráficos ficariam com a mesma cor).
  const uid = `${from}${to}`.replace(/[^a-zA-Z0-9]/g, "");
  const fillId = `sf${uid}`;
  const lineId = `sl${uid}`;
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={to} stopOpacity={0.28} />
            <Stop offset="1" stopColor={to} stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill={`url(#${fillId})`} />
        <Path
          d={line}
          stroke={`url(#${lineId})`}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          // @ts-expect-error web-only: brilho subtil no traço
          style={{ filter: `drop-shadow(0 2px 6px ${to}66)` }}
        />
        <Circle cx={lastX} cy={lastY} r={7} fill={to} fillOpacity={0.18} />
        <Circle cx={lastX} cy={lastY} r={3.4} fill="#fff" />
      </Svg>
    </View>
  );
}
