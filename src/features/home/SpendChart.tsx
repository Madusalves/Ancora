import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { formatCompact } from '@/features/transactions/format';
import { colors, fonts, createStyles } from '@/theme';

import type { Bucket } from './stats';

const CHART_HEIGHT = 170;
const PAD_TOP = 28; // espaço para o valor acima do ponto mais alto
const PAD_BOTTOM = 10;
const PAD_X = 6;
/** Até esta quantidade de pontos, todos os valores ficam visíveis; acima disso, só o selecionado. */
const SHOW_ALL_MAX = 7;

function peakIndex(buckets: Bucket[]) {
  let best = 0;
  buckets.forEach((b, i) => {
    if (b.value > buckets[best].value) best = i;
  });
  return best;
}

/** Curva suave (Catmull-Rom → Bézier) passando por todos os pontos. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    // evita que a curva afunde abaixo da base ou ultrapasse o topo
    const clamp = (y: number) => Math.min(CHART_HEIGHT - PAD_BOTTOM, Math.max(PAD_TOP, y));
    d += ` C ${c1x} ${clamp(c1y)}, ${c2x} ${clamp(c2y)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Gráfico de linha dos gastos: valores sempre visíveis e rótulos (dias) embaixo. */
export function SpendChart({ buckets }: { buckets: Bucket[] }) {
  const [width, setWidth] = useState(0);
  // A escolha vale só para o conjunto de pontos atual; ao trocar de período volta para o mais alto.
  const signature = buckets.map((b) => `${b.key}:${b.value}`).join('|');
  const [picked, setPicked] = useState<{ signature: string; index: number } | null>(null);
  const selected = picked && picked.signature === signature ? picked.index : peakIndex(buckets);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const n = buckets.length;
  const max = Math.max(...buckets.map((b) => b.value), 0);
  const slot = n > 0 ? width / n : 0;
  const baseY = CHART_HEIGHT - PAD_BOTTOM;
  const usable = baseY - PAD_TOP;
  const pts = buckets.map((b, i) => ({
    x: slot * i + slot / 2,
    y: max > 0 ? baseY - (b.value / max) * usable : baseY,
  }));

  const line = smoothPath(pts);
  const area = pts.length > 1 ? `${line} L ${pts[n - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z` : '';
  const showAll = n <= SHOW_ALL_MAX;

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.22} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* linha de base */}
          <Path d={`M ${PAD_X} ${baseY} L ${width - PAD_X} ${baseY}`} stroke={colors.outlineSoft} strokeWidth={1} />

          {area ? <Path d={area} fill="url(#spendFill)" /> : null}
          {max > 0 ? (
            <Path d={line} stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" fill="none" />
          ) : null}

          {pts.map((p, i) => {
            const b = buckets[i];
            const on = i === selected;
            const showValue = b.value > 0 && (showAll || on);
            return (
              <G key={b.key}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? 5.5 : 3.5}
                  fill={on ? colors.primary : colors.surface}
                  stroke={colors.primary}
                  strokeWidth={2}
                />
                {showValue ? (
                  <SvgText
                    x={Math.min(width - PAD_X, Math.max(PAD_X, p.x))}
                    y={p.y - 12}
                    fontSize={on ? 12 : 11}
                    fontFamily={on ? fonts.semiBold : fonts.medium}
                    fill={on ? colors.primary : colors.textMuted}
                    textAnchor="middle">
                    {formatCompact(b.value)}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height: CHART_HEIGHT }} />
      )}

      {/* rótulos embaixo; toque para destacar um ponto */}
      <View style={styles.labels}>
        {buckets.map((b, i) => {
          const on = i === selected;
          return (
            <Pressable
              key={b.key}
              accessibilityRole="button"
              accessibilityLabel={`${b.label}: ${formatCompact(b.value)}`}
              onPress={() => setPicked({ signature, index: i })}
              hitSlop={{ top: 8, bottom: 8 }}
              style={styles.labelCol}>
              <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
                {b.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = createStyles(() => ({
  labels: { flexDirection: 'row', marginTop: 6 },
  labelCol: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  labelOn: { fontFamily: fonts.semiBold, color: colors.primary },
}));
