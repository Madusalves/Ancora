import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
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
import { Toggle } from '@/components/Toggle';
import { Account, Category, TxType, useAccounts, useCategories, useCreateTransaction } from '@/features/transactions/api';
import {
  formatCents,
  formatLongDate,
  isSameDay,
  parseTags,
  toISODate,
} from '@/features/transactions/format';
import { CATEGORY_ICONS } from '@/features/transactions/icons';
import { NewCategoryModal } from '@/features/transactions/NewCategoryModal';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius } from '@/theme';

const icon = {
  back: require('../../../assets/icons/tx/back.svg'),
  help: require('../../../assets/icons/tx/help.svg'),
  arrowDown: require('../../../assets/icons/tx/arrow-down.svg'),
  arrowUp: require('../../../assets/icons/tx/arrow-up.svg'),
  description: require('../../../assets/icons/tx/field-description.svg'),
  date: require('../../../assets/icons/tx/field-date.svg'),
  tags: require('../../../assets/icons/tx/field-tags.svg'),
  recurring: require('../../../assets/icons/tx/recurring.svg'),
  check: require('../../../assets/icons/tx/check.svg'),
};

const COLUMNS = 4;

/** Nova Transação (Figma 43:2). */
export default function NewTransaction() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<TxType>(params.type === 'income' ? 'income' : 'expense');
  const [cents, setCents] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const categories = useCategories(type);
  const accounts = useAccounts();
  const create = useCreateTransaction();

  // Carteira interna única: o app usa sempre a primeira (e única) conta do usuário.
  const wallet: Account | undefined = accounts.data?.[0];
  const isExpense = type === 'expense';
  const amount = (parseInt(cents || '0', 10) || 0) / 100;

  const changeType = (next: TxType) => {
    setType(next);
    setCategoryId(null);
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (_e, picked) => picked && setDate(picked),
      });
    } else if (Platform.OS === 'ios') {
      setShowIosPicker((v) => !v);
    }
  };

  const save = async () => {
    if (create.isPending) return;
    if (amount <= 0) return setError(t.tx.errors.amount);
    if (!description.trim()) return setError(t.tx.errors.description);
    if (!wallet) return setError(t.tx.errors.account);
    setError('');
    try {
      await create.mutateAsync({
        accountId: wallet.id,
        categoryId,
        type,
        amount,
        description: description.trim(),
        occurredOn: toISODate(date),
        notes: notes.trim() || null,
        tags: parseTags(notes),
        recurring,
      });
      router.back();
    } catch {
      setError(t.tx.errors.save);
    }
  };

  const rows = chunk<Category | typeof ADD_TILE>([...(categories.data ?? []), ADD_TILE], COLUMNS);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.headerBtn}>
            <Image source={icon.back} style={{ width: 16, height: 16 }} contentFit="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>{t.tx.title}</Text>
          <View style={styles.headerBtn}>
            <Image source={icon.help} style={{ width: 20, height: 20 }} contentFit="contain" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Tipo */}
          <View style={styles.segment}>
            <SegmentItem
              label={t.tx.expense}
              icon={icon.arrowDown}
              selected={isExpense}
              selectedColor={colors.error}
              onPress={() => changeType('expense')}
            />
            <SegmentItem
              label={t.tx.income}
              icon={icon.arrowUp}
              selected={!isExpense}
              selectedColor={colors.primary}
              onPress={() => changeType('income')}
            />
          </View>

          {/* Valor */}
          <View style={[styles.card, styles.amountCard]}>
            <Text style={styles.amountLabel}>{t.tx.amountLabel}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>R$</Text>
              <TextInput
                value={formatCents(cents)}
                onChangeText={(v) => {
                  setError('');
                  setCents(v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11));
                }}
                keyboardType="numeric"
                accessibilityLabel={t.tx.amountLabel}
                selectionColor={colors.primary}
                style={styles.amountInput}
              />
            </View>
            <View style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: isExpense ? colors.error : colors.primaryStrong }]} />
              <Text style={styles.chipText}>{isExpense ? t.tx.expenseChip : t.tx.incomeChip}</Text>
            </View>
            <Text style={styles.walletNote}>{t.tx.walletNote}</Text>
          </View>

          {/* Categorias */}
          <View style={styles.categories}>
            <Text style={styles.sectionLabel}>{t.tx.category}</Text>
            <View style={styles.grid}>
              {rows.map((row, r) => (
                <View key={r} style={styles.gridRow}>
                  {row.map((c) =>
                    c === ADD_TILE ? (
                      <Pressable
                        key="add"
                        accessibilityRole="button"
                        accessibilityLabel={t.tx.newCategoryTitle}
                        onPress={() => setShowNewCategory(true)}
                        style={styles.tile}>
                        <View style={styles.tileIcon}>
                          <Text style={styles.plus}>+</Text>
                        </View>
                        <Text numberOfLines={1} style={styles.tileLabel}>
                          {t.tx.newCategory}
                        </Text>
                      </Pressable>
                    ) : (
                      <CategoryTile
                        key={c.id}
                        category={c}
                        selected={c.id === categoryId}
                        onPress={() => setCategoryId(c.id === categoryId ? null : c.id)}
                      />
                    ),
                  )}
                  {Array.from({ length: COLUMNS - row.length }, (_, i) => (
                    <View key={`s${i}`} style={styles.flex} />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Detalhes */}
          <View style={[styles.card, styles.form]}>
            <Labeled label={t.tx.description}>
              <FieldInput iconSource={icon.description} iconSize={{ width: 13.5, height: 12 }}>
                <TextInput
                  value={description}
                  onChangeText={(v) => {
                    setError('');
                    setDescription(v);
                  }}
                  placeholder={t.tx.descriptionPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  style={styles.inputText}
                />
              </FieldInput>
            </Labeled>

            <Labeled label={t.tx.date}>
              <View style={styles.dateRow}>
                <Pressable style={styles.flex} onPress={openDatePicker} accessibilityRole="button">
                  <FieldInput iconSource={icon.date} iconSize={{ width: 13.5, height: 15 }}>
                    <Text style={styles.inputText}>{formatLongDate(date)}</Text>
                  </FieldInput>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDate(new Date())}
                  style={[styles.today, isSameDay(date, new Date()) && styles.todayOn]}>
                  <Text style={styles.todayText}>{t.tx.today}</Text>
                </Pressable>
              </View>
              {showIosPicker ? (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="inline"
                  onChange={(_e, picked) => picked && setDate(picked)}
                />
              ) : null}
            </Labeled>

            <Labeled label={t.tx.notes}>
              <FieldInput iconSource={icon.tags} iconSize={{ width: 13.5, height: 12 }}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t.tx.notesPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="none"
                  style={styles.inputText}
                />
              </FieldInput>
            </Labeled>
          </View>

          {/* Recorrência */}
          <View style={[styles.card, styles.recurring]}>
            <View style={styles.recurringInfo}>
              <View style={styles.recurringIcon}>
                <Image source={icon.recurring} style={{ width: 18, height: 20 }} contentFit="contain" />
              </View>
              <View>
                <Text style={styles.recurringTitle}>{t.tx.recurring}</Text>
                <Text style={styles.caption}>{t.tx.recurringHint}</Text>
              </View>
            </View>
            <Toggle value={recurring} onChange={setRecurring} accessibilityLabel={t.tx.recurring} />
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            large
            label={create.isPending ? t.tx.saving : t.tx.save}
            icon={icon.check}
            iconSize={{ width: 12.2, height: 9 }}
            onPress={save}
            style={create.isPending ? styles.disabled : undefined}
          />
        </View>
      </KeyboardAvoidingView>

      <NewCategoryModal
        visible={showNewCategory}
        kind={type}
        onClose={() => setShowNewCategory(false)}
        onCreated={(c) => {
          setCategoryId(c.id);
          setShowNewCategory(false);
        }}
      />
    </SafeAreaView>
  );
}

const ADD_TILE = 'add' as const;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function SegmentItem(props: {
  label: string;
  icon: number;
  selected: boolean;
  selectedColor: string;
  onPress: () => void;
}) {
  const color = props.selected ? props.selectedColor : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={[styles.segmentItem, props.selected && styles.segmentItemOn]}>
      <Image source={props.icon} style={{ width: 9.33, height: 9.33 }} tintColor={color} contentFit="contain" />
      <Text style={[styles.segmentLabel, { color }]}>{props.label}</Text>
    </Pressable>
  );
}

function CategoryTile({ category, selected, onPress }: { category: Category; selected: boolean; onPress: () => void }) {
  const ic = CATEGORY_ICONS[category.icon];
  return (
    // Ícones desconhecidos (ex.: 'tag') mostram a inicial da categoria.
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tile, selected && styles.tileOn]}>
      <View style={[styles.tileIcon, selected && styles.tileIconOn]}>
        {ic ? (
          <Image source={ic.source} style={{ width: ic.width, height: ic.height }} contentFit="contain" />
        ) : (
          <Text style={styles.initial}>{category.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <Text numberOfLines={1} style={[styles.tileLabel, selected && styles.tileLabelOn]}>
        {category.name}
      </Text>
    </Pressable>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.labeled}>
      <Text style={styles.caption}>{label}</Text>
      {children}
    </View>
  );
}

function FieldInput(props: {
  iconSource: number;
  iconSize: { width: number; height: number };
  rightPad?: number;
  children: ReactNode;
}) {
  return (
    <View style={[styles.input, props.rightPad ? { paddingRight: props.rightPad } : null]}>
      <View style={styles.inputIcon}>
        <Image source={props.iconSource} style={props.iconSize} contentFit="contain" />
      </View>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.text,
  },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 24 },

  segment: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  segmentItemOn: { backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)' },
  segmentLabel: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
  },
  amountCard: { alignItems: 'center', padding: 25 },
  amountLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 4,
  },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6 },
  currency: { ...typo(fonts.displaySemiBold, 24, 32, -0.24), color: colors.textSubtle },
  amountInput: {
    ...typo(fonts.displayBold, 40, 48, -1),
    color: colors.text,
    minWidth: 120,
    padding: 0,
    textAlign: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 5,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: 'rgba(188,202,192,0.4)',
    borderRadius: radius.pill,
  },
  walletNote: { marginTop: 12, textAlign: 'center', fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.textSubtle },
  chipDot: { width: 8, height: 8, borderRadius: radius.pill },
  chipText: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.22, color: colors.textMuted },

  categories: { gap: 8 },
  sectionLabel: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, color: colors.text },
  grid: { gap: 10 },
  gridRow: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
  },
  tileOn: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  tileIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
  },
  tileIconOn: { backgroundColor: colors.primaryContainer },
  tileLabel: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.22, color: colors.textMuted },
  tileLabelOn: { fontFamily: fonts.semiBold, color: colors.primary },

  plus: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 28, color: colors.primary },
  initial: { fontFamily: fonts.displayBold, fontSize: 18, lineHeight: 24, color: colors.primary },

  form: { padding: 17, gap: 16 },
  labeled: { gap: 4 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.22, color: colors.textMuted },
  input: {
    minHeight: 42,
    justifyContent: 'center',
    paddingLeft: 41,
    paddingRight: 13,
    paddingVertical: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.sm,
  },
  inputIcon: { position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center' },
  inputText: { ...typo(fonts.regular, 14, 20, 0), color: colors.text, padding: 0 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  today: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.sm,
  },
  todayOn: { backgroundColor: colors.primaryContainerTint, borderColor: colors.primaryStrong },
  todayText: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, color: colors.primary },
  recurring: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 17 },
  recurringInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  recurringIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
  },
  recurringTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.text },
  error: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.error, textAlign: 'center' },

  footer: { padding: 16, backgroundColor: 'rgba(247,249,251,0.95)' },
  disabled: { opacity: 0.6 },
});

function typo(fontFamily: string, fontSize: number, lineHeight: number, letterSpacing: number) {
  return { fontFamily, fontSize, lineHeight, letterSpacing };
}
