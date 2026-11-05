import { StyleProp, View, ViewStyle } from 'react-native';

import { colors, radius, createStyles } from '@/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = createStyles(() => ({
  card: {
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.md,
    boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
  },
}));
