import { Image, ImageSource } from 'expo-image';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius, createStyles } from '@/theme';

type Variant = 'primary' | 'outline' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Ícone à direita do texto (SVG com tamanho próprio). */
  icon?: ImageSource;
  iconSize?: { width: number; height: number };
  /** Botão principal de formulário (48px, texto 16). */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, iconSize, large, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.base, variantStyles[variant], pressed && styles.pressed, large && styles.large, style]}>
      <Text style={[styles.label, large && styles.labelLarge, { color: labelColors[variant] }]}>{label}</Text>
      {icon ? (
        <View style={iconSize}>
          <Image source={icon} style={iconSize} contentFit="contain" />
        </View>
      ) : null}
    </Pressable>
  );
}

const labelColors: Record<Variant, string> = {
  primary: colors.onPrimary,
  outline: colors.textMuted,
  ghost: colors.textMuted,
};

const variantStyles = createStyles(() => ({
  primary: {
    backgroundColor: colors.primary,
    boxShadow: '0px 4px 5px rgba(193,154,30,0.3)',
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.outline,
  },
  ghost: {},
}));

const styles = createStyles(() => ({
  base: {
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.8 },
  large: { height: 48 },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  labelLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
}));
