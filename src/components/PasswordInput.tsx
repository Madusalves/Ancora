import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { ComponentRef, Ref } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';

import { t } from '@/i18n/pt-BR';
import { colors, createStyles, fonts, getScheme, radius } from '@/theme';

type Props = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'onSubmitEditing' | 'editable' | 'returnKeyType' | 'autoComplete'
> & { inputRef?: Ref<ComponentRef<typeof TextInput>> };

/** Campo de senha com botão de mostrar/ocultar. Mesmo visual do campo de e-mail. */
export function PasswordInput({ inputRef, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.wrap}>
      <TextInput
        {...props}
        ref={inputRef}
        keyboardAppearance={getScheme()}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.placeholder}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? t.auth.hidePassword : t.auth.showPassword}
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        style={styles.eye}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSubtle} />
      </Pressable>
    </View>
  );
}

const styles = createStyles(() => ({
  wrap: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.sm,
    boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 44,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.text,
    textAlign: 'center',
  },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
}));
