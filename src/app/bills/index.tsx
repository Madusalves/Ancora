import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Bill, useBills, useDeleteBill, usePayBill } from '@/features/bills/api';
import { dueInfo, isNextMonthOrLater, refMonth, shortDate, STATUS_COLOR } from '@/features/bills/dates';
import { billAmountLabel, lastPaidAmount } from '@/features/bills/format';
import { formatBRL, formatCents } from '@/features/transactions/format';
import { CATEGORY_ICONS } from '@/features/transactions/icons';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius, createStyles, getScheme } from '@/theme';
import { useScreenLayout } from '@/theme/layout';

type Tab = 'open' | 'paid';

/** Contas a pagar: lista com vencimento, pagar (informando o valor real nas variáveis), editar e excluir. */
export default function Bills() {
  const router = useRouter();
  const layout = useScreenLayout();
  const bills = useBills();
  const pay = usePayBill();
  const del = useDeleteBill();
  const [tab, setTab] = useState<Tab>('open');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const all = useMemo(() => bills.data ?? [], [bills.data]);
  // Conta mensal já paga gera a do mês seguinte: ela só aparece quando o mês chegar.
  const open = useMemo(
    () => all.filter((b) => !b.paid_at && !(b.recurrence && isNextMonthOrLater(b.due_date))),
    [all],
  );
  const paid = useMemo(
    () => all.filter((b) => b.paid_at).sort((a, b) => (b.paid_at! > a.paid_at! ? 1 : -1)),
    [all],
  );
  const overdue = open.filter((b) => dueInfo(b.due_date).status === 'overdue').length;
  const pending = open.filter((b) => b.amount === null).length;
  const total = open.reduce((s, b) => s + (b.amount ?? 0), 0);
  const list = tab === 'open' ? open : paid;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={goBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t.bills.title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.home.newBill}
          onPress={() => router.push('/bills/new')}
          style={[styles.iconBtn, styles.addBtn]}>
          <Ionicons name="add" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[styles.list, layout.content(32)]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.top}>
            {tab === 'open' ? (
              <Card style={styles.summary}>
                <Text style={styles.summaryLabel}>{t.bills.totalToPay}</Text>
                <Text style={styles.summaryValue}>{formatBRL(total)}</Text>
                {overdue > 0 ? <Text style={styles.summaryWarn}>{t.bills.overdueCount(overdue)}</Text> : null}
                {pending > 0 ? <Text style={styles.summaryHint}>{t.bills.pendingValues(pending)}</Text> : null}
              </Card>
            ) : null}
            <View style={styles.segment}>
              {(['open', 'paid'] as const).map((k) => (
                <Pressable
                  key={k}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === k }}
                  onPress={() => setTab(k)}
                  style={[styles.segmentItem, tab === k && styles.segmentOn]}>
                  <Text style={[styles.segmentText, tab === k && styles.segmentTextOn]}>
                    {k === 'open' ? t.bills.toPay : t.bills.paid}
                  </Text>
                </Pressable>
              ))}
            </View>
            {bills.isLoading ? <ActivityIndicator color={colors.primary} style={styles.pad} /> : null}
            {bills.isError ? <Text style={styles.error}>{t.bills.loadError}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          bills.isLoading ? undefined : (
            <Text style={styles.empty}>{tab === 'open' ? t.bills.emptyOpen : t.bills.emptyPaid}</Text>
          )
        }
        renderItem={({ item }) => (
          <BillRow
            bill={item}
            lastAmount={lastPaidAmount(all, item.name)}
            paying={pay.isPending && pay.variables?.id === item.id}
            confirmingDelete={confirmId === item.id}
            onEdit={() => router.push({ pathname: '/bills/edit', params: { id: item.id } })}
            onPay={(amount) => pay.mutate({ id: item.id, amount })}
            onAskDelete={() => setConfirmId(item.id)}
            onDelete={() => {
              setConfirmId(null);
              del.mutate(item.id);
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

function BillRow(props: {
  bill: Bill;
  lastAmount: number | null;
  paying: boolean;
  confirmingDelete: boolean;
  onEdit: () => void;
  onPay: (amount?: number) => void;
  onAskDelete: () => void;
  onDelete: () => void;
}) {
  const { bill } = props;
  const isPaid = !!bill.paid_at;
  const info = dueInfo(bill.due_date);
  const ic = bill.category ? CATEGORY_ICONS[bill.category.icon] : undefined;
  const sub = isPaid ? t.bills.paidOn(shortDate(new Date(bill.paid_at!)), refMonth(bill.due_date)) : info.label;
  const subColor = isPaid ? colors.primary : STATUS_COLOR[info.status];

  // Conta variável (ou sem valor): pergunta o valor real antes de pagar.
  const needsAmount = bill.variable || bill.amount === null;
  const [editing, setEditing] = useState(false);
  const [cents, setCents] = useState(bill.amount ? String(Math.round(bill.amount * 100)) : '');
  const paidAmount = (parseInt(cents || '0', 10) || 0) / 100;
  const canConfirm = paidAmount > 0 && !props.paying;

  const onPressPay = () => (needsAmount ? setEditing(true) : props.onPay());

  return (
    <View style={[styles.row, !isPaid && info.status === 'overdue' && styles.rowOverdue]}>
      <Pressable accessibilityRole="button" disabled={isPaid} onPress={props.onEdit} style={styles.rowTop}>
        <View style={styles.tile}>
          {isPaid ? (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
          ) : ic ? (
            <Image source={ic.source} style={{ width: ic.width, height: ic.height }} contentFit="contain" />
          ) : (
            <Ionicons name="receipt-outline" size={20} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {bill.name}
          </Text>
          <Text style={[styles.sub, { color: subColor }]}>
            {sub}
            {bill.recurrence && !isPaid ? ` • ${t.bills.repeats}` : ''}
          </Text>
        </View>
        <Text style={[styles.amount, bill.amount === null && styles.amountTbd]}>
          {billAmountLabel(isPaid ? { ...bill, variable: false } : bill)}
        </Text>
      </Pressable>

      {!isPaid && editing ? (
        <View style={styles.payBox}>
          <Text style={styles.payLabel}>{t.bills.payAmount}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>R$</Text>
            <TextInput
              value={cents ? formatCents(cents) : ''}
              placeholder="0,00"
              placeholderTextColor={colors.placeholder}
              keyboardAppearance={getScheme()}
              cursorColor={colors.primary}
              onChangeText={(v) => setCents(v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11))}
              keyboardType="numeric"
              autoFocus
              accessibilityLabel={t.bills.payAmount}
              selectionColor={colors.primary}
              style={styles.amountInput}
            />
          </View>
          {props.lastAmount !== null ? (
            <Text style={styles.payHint}>{t.bills.lastBill(formatBRL(props.lastAmount))}</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setEditing(false)} hitSlop={8}>
              <Text style={styles.delete}>{t.bills.cancel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!canConfirm}
              onPress={() => props.onPay(paidAmount)}
              style={[styles.payBtn, !canConfirm && styles.disabled]}>
              <Text style={styles.payText}>{props.paying ? t.bills.paying : t.bills.confirmPay}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!isPaid && !editing ? (
        <View style={styles.actions}>
          {props.confirmingDelete ? (
            <Pressable accessibilityRole="button" onPress={props.onDelete}>
              <Text style={styles.deleteConfirm}>{t.bills.confirmDelete}</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={props.onAskDelete} hitSlop={8}>
              <Text style={styles.delete}>{t.bills.delete}</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={props.paying}
            onPress={onPressPay}
            style={[styles.payBtn, props.paying && styles.disabled]}>
            <Text style={styles.payText}>{props.paying ? t.bills.paying : t.bills.pay}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = createStyles(() => ({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: colors.primary },
  title: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  top: { gap: 12, marginBottom: 4 },
  summary: { gap: 2 },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  summaryValue: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 38, letterSpacing: -0.6, color: colors.text },
  summaryWarn: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.error },
  summaryHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSubtle },
  segment: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: colors.surfaceHigh, borderRadius: radius.md },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm },
  segmentOn: { backgroundColor: colors.surface, boxShadow: '0px 1px 1px rgba(0,0,0,0.05)' },
  segmentText: { fontFamily: fonts.semiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textMuted },
  segmentTextOn: { color: colors.primary },
  pad: { padding: 12 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, textAlign: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 24 },

  row: {
    padding: 14,
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.md,
  },
  rowOverdue: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20, color: colors.text },
  sub: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  amount: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  amountTbd: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSubtle },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  delete: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle },
  deleteConfirm: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.error },
  payBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: radius.sm },
  payText: { fontFamily: fonts.semiBold, fontSize: 12, letterSpacing: 0.6, color: colors.onPrimary },
  disabled: { opacity: 0.5 },

  payBox: { gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.outlineSoft },
  payLabel: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.22, color: colors.textMuted },
  payHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSubtle },
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
}));
