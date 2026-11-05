import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors, fonts, radius, createStyles } from '@/theme';

import { flowExpense, flowIncome, sliceColors } from './palette';

export { flowExpense, flowIncome, sliceColors };

const SIZE = 176;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

type DonutProps = { shares: number[]; centerValue: string; centerLabel: string };

/** Rosca de distribuição. `shares` são frações (0..1) que somam 1. */
export function Donut({ shares, centerValue, centerLabel }: DonutProps) {
  const offsets = shares.map((_, i) => shares.slice(0, i).reduce((s, v) => s + v, 0) * C);
  return (
    <View style={styles.donut} accessibilityLabel={`${centerValue} ${centerLabel}`}>
      <Svg width={SIZE} height={SIZE}>
        <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.surfaceHigh} strokeWidth={STROKE} fill="none" />
          {shares.map((s, i) => {
            const len = s * C;
            return (
              <Circle
                key={i}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke={sliceColors()[i % sliceColors().length]}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={`${Math.max(len - 2, 0)} ${C}`}
                strokeDashoffset={-offsets[i]}
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutValue}>{centerValue}</Text>
        <Text style={styles.donutLabel}>{centerLabel}</Text>
      </View>
    </View>
  );
}

type FlowItem = { key: string; label: string; income: number; expense: number };

const BAR_AREA = 120;

/** Barras agrupadas de entradas e saídas por mês; o último mês fica em destaque. */
export function CashFlowChart({ items }: { items: FlowItem[] }) {
  const max = Math.max(1, ...items.flatMap((i) => [i.income, i.expense]));
  const h = (v: number) => (v > 0 ? Math.max(4, (v / max) * BAR_AREA) : 0);
  return (
    <View style={styles.flow}>
      {items.map((it, idx) => {
        const last = idx === items.length - 1;
        return (
          <View key={it.key} style={styles.flowCol}>
            <View style={styles.bars}>
              <View style={[styles.bar, { height: h(it.income), backgroundColor: flowIncome(), opacity: last ? 1 : 0.85 }]} />
              <View style={[styles.bar, { height: h(it.expense), backgroundColor: flowExpense() }]} />
            </View>
            <Text style={[styles.flowLabel, last && styles.flowLabelOn]}>{it.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = createStyles(() => ({
  donut: { width: SIZE, height: SIZE, alignSelf: 'center' },
  donutCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: colors.text },
  donutLabel: { fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 0.8, color: colors.textSubtle },

  flow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 8 },
  flowCol: { alignItems: 'center', gap: 8, flex: 1 },
  bars: { height: BAR_AREA, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bar: { width: 14, borderTopLeftRadius: radius.sm / 2, borderTopRightRadius: radius.sm / 2 },
  flowLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle },
  flowLabelOn: { fontFamily: fonts.semiBold, color: colors.text },
}));
