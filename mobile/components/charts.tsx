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
}: {
  size?: number;
  stroke?: number;
  progress: number;
  color: string;
  glow?: boolean;
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
          stroke={colors.surfaceAlt}
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

export function Sparkline({
  values,
  width,
  height = 90,
  color = colors.text,
}: {
  values: number[];
  width: number;
  height?: number;
  color?: string;
}) {
  if (values.length < 2) values = [0, ...values];
  const pad = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * width;
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  let line = `M ${x(0).toFixed(1)} ${y(values[0]).toFixed(1)}`;
  for (let i = 1; i < values.length; i++) {
    line += ` L ${x(i).toFixed(1)} ${y(values[i]).toFixed(1)}`;
  }
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.22} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#spark)" />
        <Path
          d={line}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx={lastX} cy={lastY} r={3.5} fill={color} />
      </Svg>
    </View>
  );
}
