import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts } from '@/theme';

const SIZE = 156;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const ARC = `M ${STROKE / 2} ${SIZE / 2} A ${R} ${R} 0 0 1 ${SIZE - STROKE / 2} ${SIZE / 2}`;
const LENGTH = Math.PI * R;

type GaugeProps = { value: number; caption: string; color?: string };

/** Medidor semicircular. `value` de 0 a 1. */
export function Gauge({ value, caption, color = colors.primary }: GaugeProps) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.wrap} accessibilityLabel={`${Math.round(v * 100)}% ${caption}`}>
      <Svg width={SIZE} height={SIZE / 2 + STROKE / 2}>
        <Path d={ARC} stroke={colors.surfaceHighest} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
        {v > 0 ? (
          <Path
            d={ARC}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${LENGTH * v} ${LENGTH}`}
          />
        ) : null}
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{Math.round(v * 100)}%</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE / 2 + STROKE / 2, alignSelf: 'center' },
  center: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  value: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.5, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 14, color: colors.textMuted },
});
