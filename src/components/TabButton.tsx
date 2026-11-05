import { Ionicons } from '@expo/vector-icons';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { useTourTarget } from '@/features/tour/TourProvider';
import { colors, fonts } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TabButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  icon: IconName;
  iconActive: IconName;
  /** Injetado pelo TabTrigger (expo-router/ui). */
  isFocused?: boolean;
  /** Identificador do passo do tour guiado que destaca esta aba. */
  tourId?: string;
};

export function TabButton({ label, icon, iconActive, isFocused, tourId, ...rest }: TabButtonProps) {
  const tourRef = useTourTarget(tourId);
  return (
    <Pressable
      {...rest}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={label}
      android_ripple={{ color: 'transparent' }}
      style={[styles.button, { backgroundColor: 'transparent', outlineStyle: 'none' } as object]}>
      {({ pressed }) => (
        <View ref={tourRef} collapsable={false} style={styles.item}>
          <View style={[styles.circle, (isFocused || pressed) && styles.circleOn]}>
            <Ionicons
              name={isFocused ? iconActive : icon}
              size={22}
              color={isFocused ? colors.primary : colors.textSubtle}
            />
          </View>
          <Text style={[styles.label, isFocused && styles.labelOn]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flex: 1, alignItems: 'center' },
  item: { minWidth: 64, alignItems: 'center', gap: 2, paddingVertical: 4 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    borderCurve: 'circular',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: { backgroundColor: colors.primaryContainerTint },
  label: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, color: colors.textSubtle },
  labelOn: { fontFamily: fonts.semiBold, color: colors.primary },
});
