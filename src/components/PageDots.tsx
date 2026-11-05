import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

export function PageDots({ count, index }: { count: number; index: number }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: count, now: index + 1 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === index && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.dot },
  active: { width: 32, backgroundColor: colors.primary },
});
