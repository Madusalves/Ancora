import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useBudget, useCategoryLimits, useSetBudget, useSetLimit } from '@/features/goals/api';
import { useCategories } from '@/features/transactions/api';
import { NewCategoryModal } from '@/features/transactions/NewCategoryModal';
import { formatCents } from '@/features/transactions/format';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius, createStyles, getScheme } from '@/theme';

/**
 * Formulário de limites. `target`:
 *  - ausente → novo limite (escolhe a categoria);
 *  - "total" → orçamento mensal total;
 *  - id de categoria → edita o teto dessa categoria.
 */
export default function LimitForm() {
  const router = useRouter();
  const f = t.goals.form;
  const { target } = useLocalSearchParams<{ target?: string }>();
  const isTotal = target === 'total';

  const categories = useCategories('expense');
  const limits = useCategoryLimits();
  const budget = useBudget();
  const setLimit = useSetLimit();
  const setBudget = useSetBudget();

  const existing = !isTotal && target ? limits.data?.find((l) => l.category_id === target) : undefined;
  const [categoryId, setCategoryId] = useState<string | null>(target && !isTotal ? target : null);
  // `null` = ainda não editado: usa o valor salvo como ponto de partida.
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const saved = isTotal ? budget.data : existing?.monthly_limit;
  const cents = typed ?? (saved ? String(Math.round(saved * 100)) : '');
  const amount = (parseInt(cents || '0', 10) || 0) / 100;

  const takenIds = new Set((limits.data ?? []).map((l) => l.category_id));
  const choices = (categories.data ?? []).filter((c) => !takenIds.has(c.id));
  const editingCategory = !isTotal && !!target;

  const title = isTotal ? f.budgetTitle : editingCategory ? f.editTitle : f.createTitle;

  const save = async () => {
    if (busy) return;
    if (!isTotal && !categoryId) return setError(f.errors.category);
    if (amount <= 0) return setError(f.errors.amount);
    setError('');
    setBusy(true);
    try {
      if (isTotal) await setBudget.mutateAsync(amount);
      else await setLimit.mutateAsync({ categoryId: categoryId!, limit: amount });
      router.back();
    } catch {
      setError(f.errors.save);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {!isTotal ? (
              <View style={styles.field}>
                <Text style={styles.caption}>{f.category}</Text>
                {editingCategory ? (
                  <Text style={styles.fixed}>{existing?.category.name ?? ''}</Text>
                ) : (
                  <View style={styles.chips}>
                    {choices.map((c) => {
                      const on = c.id === categoryId;
                      return (
                        <Pressable
                          key={c.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          onPress={() => {
                            setCategoryId(on ? null : c.id);
                            setError('');
                          }}
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
                )}
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.caption}>{isTotal ? f.budgetLabel : f.limitLabel}</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>R$</Text>
                <TextInput
                  value={cents ? formatCents(cents) : ''}
                  placeholder="0,00"
                  placeholderTextColor={colors.placeholder}
                  keyboardAppearance={getScheme()}
                  cursorColor={colors.primary}
                  onChangeText={(v) => {
                    setError('');
                    setTyped(v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11));
                  }}
                  keyboardType="numeric"
                  accessibilityLabel={isTotal ? f.budgetLabel : f.limitLabel}
                  selectionColor={colors.primary}
                  style={styles.amountInput}
                />
              </View>
            </View>
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button large label={busy ? f.saving : f.save} onPress={save} style={busy ? styles.disabled : undefined} />
        </View>
      </KeyboardAvoidingView>

      <NewCategoryModal
        visible={showNewCategory}
        kind="expense"
        onClose={() => setShowNewCategory(false)}
        onCreated={(c) => {
          setCategoryId(c.id);
          setError('');
          setShowNewCategory(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = createStyles(() => ({
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
  fixed: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
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
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, textAlign: 'center' },
  footer: { padding: 16, backgroundColor: 'colors.scrimStrong' },
  disabled: { opacity: 0.6 },
}));
