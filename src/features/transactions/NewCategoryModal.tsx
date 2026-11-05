import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Category, TxType, useCreateCategory } from '@/features/transactions/api';
import { CATEGORY_ICONS } from '@/features/transactions/icons';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius } from '@/theme';

/** Modal para criar uma categoria do usuário (compartilhado entre transação e limites). */
export function NewCategoryModal(props: {
  visible: boolean;
  kind: TxType;
  onClose: () => void;
  onCreated: (c: Category) => void;
}) {
  const create = useCreateCategory();
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState('tag');
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setIconKey('tag');
    setError('');
  };

  const close = () => {
    reset();
    props.onClose();
  };

  const submit = async () => {
    if (create.isPending) return;
    const trimmed = name.trim();
    if (!trimmed) return setError(t.tx.newCategoryErrorName);
    try {
      const created = await create.mutateAsync({ name: trimmed, icon: iconKey, kind: props.kind });
      reset();
      props.onCreated(created);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setError(code === '23505' ? t.tx.newCategoryErrorDuplicate : t.tx.newCategoryErrorSave);
    }
  };

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t.tx.newCategoryCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>{t.tx.newCategoryTitle}</Text>

          <View style={styles.labeled}>
            <Text style={styles.caption}>{t.tx.newCategoryName}</Text>
            <View style={styles.input}>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setError('');
                  setName(v);
                }}
                maxLength={24}
                autoFocus
                placeholder={t.tx.newCategoryPlaceholder}
                placeholderTextColor={colors.placeholder}
                style={styles.inputText}
              />
            </View>
          </View>

          <View style={styles.labeled}>
            <Text style={styles.caption}>{t.tx.newCategoryIcon}</Text>
            <View style={styles.iconPicker}>
              {Object.entries(CATEGORY_ICONS).map(([key, ic]) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: iconKey === key }}
                  onPress={() => setIconKey(key)}
                  style={[styles.pickerIcon, iconKey === key && styles.pickerIconOn]}>
                  <Image source={ic.source} style={{ width: ic.width, height: ic.height }} contentFit="contain" />
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label={create.isPending ? t.tx.saving : t.tx.newCategorySave} onPress={submit} />
          <Pressable accessibilityRole="button" onPress={close} style={styles.cancel}>
            <Text style={styles.cancelText}>{t.tx.newCategoryCancel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  card: {
    padding: 20,
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  labeled: { gap: 4 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.22, color: colors.textMuted },
  input: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.sm,
  },
  inputText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text, padding: 0 },
  iconPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerIconOn: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  error: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.error, textAlign: 'center' },
  cancel: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, color: colors.primary },
});
