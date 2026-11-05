import { Pressable, View } from 'react-native';

import { colors, radius, createStyles } from '@/theme';

type ToggleProps = { value: boolean; onChange: (v: boolean) => void; accessibilityLabel?: string };

export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={[styles.track, value && styles.trackOn]}>
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  );
}

const styles = createStyles(() => ({
  track: { width: 44, height: 24, borderRadius: radius.pill, backgroundColor: colors.surfaceHighest },
  trackOn: { backgroundColor: colors.primary },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.switchBorder,
  },
  thumbOn: { left: 22, borderColor: colors.surface },
}));
