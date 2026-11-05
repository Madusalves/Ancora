import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { Toggle } from '@/components/Toggle';
import { useCategories } from '@/features/transactions/api';
import { NewCategoryModal } from '@/features/transactions/NewCategoryModal';
import { formatCents, toISODate } from '@/features/transactions/format';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius } from '@/theme';

import type { NewBill } from './api';

export type BillFormValues = {
  name: string;
  amount: number | null;
  due: Date;
  categoryId: string | null;
  recurring: boolean;
  variable: boolean;
};

type Props = {
  title: string;
  saveLabel: string;
  initial?: BillFormValues;
  /** Deve lançar erro se não conseguir salvar. */
  onSubmit: (bill: NewBill) => Promise<void>;
};

const toCents = (amount: number | null) => (amount ? String(Math.round(amount * 100)) : '');

/** Formulário de conta a pagar (nova ou existente). Sem design no Figma. */
export function BillForm({ title, saveLabel, initial, onSubmit }: Props) {
  const router = useRouter();
  const f = t.bills.form;
  const categories = useCategories('expense');

  const [name, setName] = useState(initial?.name ?? '');
  const [cents, setCents] = useState(toCents(initial?.amount ?? null));
  const [due, setDue] = useState(initial?.due ?? new Date());
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [variable, setVariable] = useState(initial?.variable ?? false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const amount = (parseInt(cents || '0', 10) || 0) / 100;

  const save = async () => {
    if (busy) return;
    if (!name.trim()) return setError(f.errors.name);
    // Conta de valor variável pode ficar sem valor ("a definir"); a fixa precisa de valor.
    if (!variable && amount <= 0) return setError(f.errors.amount);
    setError('');
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        amount: amount > 0 ? amount : null,
        dueDate: toISODate(due),
        categoryId,
        recurring,
        variable,
      });
    } catch {
      setError(f.errors.save);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Field label={f.name}>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setError('');
                }}
                placeholder={f.namePlaceholder}
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </Field>

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchTitle}>{f.variable}</Text>
                <Text style={styles.caption}>{f.variableHint}</Text>
              </View>
              <Toggle value={variable} onChange={setVariable} accessibilityLabel={f.variable} />
            </View>

            <Field label={variable ? f.amountEstimate : f.amount}>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>R$</Text>
                <TextInput
                  value={cents ? formatCents(cents) : ''}
                  placeholder={variable ? t.bills.amountTbd : '0,00'}
                  placeholderTextColor={colors.placeholder}
                  onChangeText={(v) => {
                    setError('');
                    setCents(v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11));
                  }}
                  keyboardType="numeric"
                  accessibilityLabel={variable ? f.amountEstimate : f.amount}
                  selectionColor={colors.primary}
                  style={styles.amountInput}
                />
              </View>
            </Field>

            <Field label={f.due}>
              <DateField value={due} onChange={setDue} />
            </Field>

            <Field label={f.category}>
              <View style={styles.chips}>
                {categories.data?.map((c) => {
                  const on = c.id === categoryId;
                  return (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      onPress={() => setCategoryId(on ? null : c.id)}
                      style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.name}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.tx.newCategoryTitle}
                  onPress={() => setShowNewCategory(true)}
                  style={[styles.chip, styles.chipAdd]}>
                  <Ionicons name="add" size={14} color={colors.primary} />
                  <Text style={[styles.chipText, styles.chipTextOn]}>{t.tx.newCategory}</Text>
                </Pressable>
              </View>
            </Field>
          </View>

          <View style={[styles.card, styles.switchRow]}>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>{f.repeat}</Text>
              <Text style={styles.caption}>{f.repeatHint}</Text>
            </View>
            <Toggle value={recurring} onChange={setRecurring} accessibilityLabel={f.repeat} />
          </View>

          <View style={styles.reminder}>
            <Ionicons name="notifications-outline" size={16} color={colors.primary} />
            <Text style={styles.reminderText}>{f.reminder}</Text>
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button large label={busy ? f.saving : saveLabel} onPress={save} style={busy ? styles.disabled : undefined} />
        </View>
      </KeyboardAvoidingView>

      <NewCategoryModal
        visible={showNewCategory}
        kind="expense"
        onClose={() => setShowNewCategory(false)}
        onCreated={(c) => {
          setCategoryId(c.id);
          setShowNewCategory(false);
        }}
      />
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.caption}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  content: { padding: 16, gap: 16 },
  card: {
    padding: 17,
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
  },
  field: { gap: 4 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.22, color: colors.textMuted },
  input: {
    minHeight: 42,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.sm,
  },
  currency: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textSubtle },
  amountInput: { flex: 1, padding: 0, fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.pill,
  },
  chipAdd: { flexDirection: 'row', alignItems: 'center', gap: 4, borderStyle: 'dashed', borderColor: colors.primary },
  chipOn: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  chipTextOn: { fontFamily: fonts.semiBold, color: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.text },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  reminderText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, textAlign: 'center' },
  footer: { padding: 16, backgroundColor: 'rgba(247,249,251,0.95)' },
  disabled: { opacity: 0.6 },
});
