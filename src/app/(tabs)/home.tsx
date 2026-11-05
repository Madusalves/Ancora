import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, type LayoutChangeEvent, type NativeScrollEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { useBills } from '@/features/bills/api';
import { dueInfo, STATUS_COLOR } from '@/features/bills/dates';
import { billAmountLabel } from '@/features/bills/format';
import { useMe, useRecentTransactions } from '@/features/home/api';
import { Gauge } from '@/features/home/Gauge';
import { SpendChart } from '@/features/home/SpendChart';
import { buildBuckets, monthSummary, periodTotals, RANGES, type Range } from '@/features/home/stats';
import { TransactionRow } from '@/features/home/TransactionRow';
import { hasSeenTour } from '@/features/tour/storage';
import { type TourStep, useTour, useTourTarget } from '@/features/tour/TourProvider';
import { useAccounts } from '@/features/transactions/api';
import { formatBRL, formatDecimal } from '@/features/transactions/format';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius } from '@/theme';
import { useScreenLayout } from '@/theme/layout';

const DOT_COLORS = [colors.primary, '#4f46e5', colors.textSubtle];

const HOME_TOUR: TourStep[] = [
  { id: 'home-avatar', title: t.tour.avatarTitle, body: t.tour.avatarBody },
  { id: 'home-actions', title: t.tour.actionsTitle, body: t.tour.actionsBody },
  { id: 'home-balance', title: t.tour.balanceTitle, body: t.tour.balanceBody },
  { id: 'tab-transactions', title: t.tour.transactionsTitle, body: t.tour.transactionsBody },
  { id: 'tab-goals', title: t.tour.goalsTitle, body: t.tour.goalsBody },
  { id: 'tab-reports', title: t.tour.reportsTitle, body: t.tour.reportsBody },
];

/** Início: saldo, gastos, resumo do mês e transações recentes. */
export default function Home() {
  const router = useRouter();
  const layout = useScreenLayout();
  const me = useMe();
  const accounts = useAccounts();
  const txs = useRecentTransactions();
  const bills = useBills();
  const [range, setRange] = useState<Range>('1S');
  // Dica de "tem mais para o lado": seta no canto enquanto houver ações fora da tela.
  const [chipsW, setChipsW] = useState({ view: 0, content: 0, x: 0 });
  const moreChips = chipsW.content - chipsW.view - chipsW.x > 4;
  const onChipsScroll = (e: { nativeEvent: NativeScrollEvent }) => setChipsW((w) => ({ ...w, x: e.nativeEvent.contentOffset.x }));
  const onChipsLayout = (e: LayoutChangeEvent) => setChipsW((w) => ({ ...w, view: e.nativeEvent.layout.width }));

  const now = useMemo(() => new Date(), [txs.dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const data = useMemo(() => txs.data ?? [], [txs.data]);
  const balance = (accounts.data ?? []).reduce((s, a) => s + a.balance, 0);
  const buckets = useMemo(() => buildBuckets(range, data, now), [range, data, now]);
  const totals = useMemo(() => periodTotals(range, data, now), [range, data, now]);
  const month = useMemo(() => monthSummary(data, now), [data, now]);
  const net = totals.income - totals.expense;
  const openBills = useMemo(() => (bills.data ?? []).filter((b) => !b.paid_at), [bills.data]);
  const loading = txs.isLoading || accounts.isLoading;

  // Tour guiado: aparece só na primeira visita (e quando pedido pelo Perfil).
  const tour = useTour();
  const avatarRef = useTourTarget('home-avatar');
  const actionsRef = useTourTarget('home-actions');
  const balanceRef = useTourTarget('home-balance');
  const { start: startTour } = tour;
  useEffect(() => {
    let cancelled = false;
    hasSeenTour().then((seen) => {
      if (seen || cancelled) return;
      // Espera o conteúdo assentar para medir os elementos com a posição final.
      setTimeout(() => {
        if (!cancelled) startTour(HOME_TOUR);
      }, 700);
    });
    return () => {
      cancelled = true;
    };
  }, [startTour]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, layout.content(24, true)]} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable
            ref={avatarRef}
            collapsable={false}
            accessibilityRole="button"
            accessibilityLabel={me.data?.firstName}
            onPress={() => router.push('/profile')}
            style={styles.avatar}>
            {me.data?.avatarUrl ? (
              <Image source={{ uri: me.data.avatarUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText}>{me.data?.initials || '·'}</Text>
            )}
          </Pressable>
          <View>
            <Text style={styles.hello}>
              {t.home.greeting}, {me.data?.firstName ?? ''} 👋
            </Text>
          </View>
        </View>

        {/* Ações rápidas: rola para o lado; a seta indica que há mais ações */}
        <View ref={actionsRef} collapsable={false} style={[styles.actionsWrap, { marginHorizontal: -layout.gutter }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.actions, { paddingHorizontal: layout.gutter }]}
            scrollEventThrottle={32}
            onScroll={onChipsScroll}
            onLayout={onChipsLayout}
            onContentSizeChange={(w) => setChipsW((c) => ({ ...c, content: w }))}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/transaction/new', params: { type: 'income' } })}
              style={[styles.chip, styles.chipPrimary]}>
              <Ionicons name="add" size={16} color={colors.onPrimary} />
              <Text style={[styles.chipText, { color: colors.onPrimary }]}>{t.home.deposit}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/transaction/new', params: { type: 'expense' } })}
              style={[styles.chip, styles.chipOutline]}>
              <Ionicons name="remove" size={16} color={colors.text} />
              <Text style={styles.chipText}>{t.home.spend}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/bills/new')}
              style={[styles.chip, styles.chipOutline]}>
              <Ionicons name="calendar-outline" size={14} color={colors.text} />
              <Text style={styles.chipText}>{t.home.newBill}</Text>
            </Pressable>
          </ScrollView>
          {moreChips ? (
            <View pointerEvents="none" style={styles.moreHint}>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          ) : null}
        </View>

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
        {txs.isError ? <Text style={styles.error}>{t.home.loadError}</Text> : null}

        {/* Saldo e gastos */}
        <View ref={balanceRef} collapsable={false}>
        <Card style={styles.gap}>
          <View style={styles.cardHeader}>
            <View style={styles.iconTile}>
              <Ionicons name="trending-up" size={18} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>{t.home.balanceTitle}</Text>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balance} adjustsFontSizeToFit numberOfLines={1}>
                {formatBRL(balance)}
              </Text>
              <View style={styles.net}>
                <Ionicons
                  name={net >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={net >= 0 ? colors.primary : colors.error}
                />
                <Text style={[styles.netText, { color: net >= 0 ? colors.primary : colors.error }]}>
                  {net >= 0 ? '+' : '-'} R$ {formatDecimal(Math.abs(net))}
                </Text>
                <Text style={styles.netHint}>{t.home.netPeriod[range]}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ranges}>
            {RANGES.map((r) => (
              <Pressable
                key={r}
                accessibilityRole="button"
                accessibilityState={{ selected: r === range }}
                onPress={() => setRange(r)}
                style={[styles.range, r === range && styles.rangeOn]}>
                <Text style={[styles.rangeText, r === range && styles.rangeTextOn]}>{t.home.ranges[r]}</Text>
              </Pressable>
            ))}
          </View>

          <SpendChart buckets={buckets} />
          <Text style={styles.hint}>{t.home.balanceHint}</Text>
          <View style={styles.walletNote}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textSubtle} />
            <Text style={styles.walletNoteText}>{t.home.walletNote}</Text>
          </View>
        </Card>
        </View>

        {/* Categorias + poupança */}
        <View style={styles.twoCols}>
          <Card style={styles.colWide}>
            <Text style={styles.smallTitle}>{t.home.categoriesTitle}</Text>
            {month.expense > 0 ? (
              <>
                <View style={styles.gaugeBox}>
                  <Gauge
                    value={month.spentShare}
                    caption={month.expense > month.income ? t.home.overIncome : t.home.ofIncome}
                    color={month.expense > month.income ? colors.error : colors.primary}
                  />
                </View>
                <View style={styles.legend}>
                  {month.top.map((c, i) => (
                    <View key={c.name} style={styles.legendItem}>
                      <View style={[styles.dot, { backgroundColor: DOT_COLORS[i] }]} />
                      <Text style={styles.legendName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={styles.legendValue}>{Math.round(c.share * 100)}%</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.empty}>{t.home.noExpenses}</Text>
            )}
          </Card>

          <View style={styles.colNarrow}>
            <Card style={styles.mini}>
              <Text style={styles.smallTitle}>{t.home.savingsTitle}</Text>
              <Text style={styles.miniValue}>{Math.max(0, Math.round(month.savingsRate * 100))}%</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, month.savingsRate)) * 100}%` }]} />
              </View>
              {month.savingsRate < 0 ? <Text style={styles.miniWarn}>{t.home.savingsOver}</Text> : null}
            </Card>
            <Card style={styles.mini}>
              <Text style={styles.smallTitle}>{t.home.topSpendTitle}</Text>
              <Text style={styles.miniValue} numberOfLines={1} adjustsFontSizeToFit>
                {month.top[0]?.name ?? '—'}
              </Text>
              <Text style={styles.miniSub}>
                {month.top[0] ? `R$ ${formatDecimal(month.top[0].amount)}` : t.home.thisMonth}
              </Text>
            </Card>
          </View>
        </View>

        {/* Próximas contas a pagar */}
        <Card>
          <View style={styles.recentHeader}>
            <Text style={styles.cardTitleBig}>{t.home.billsTitle}</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/bills')} hitSlop={8}>
              <Text style={styles.seeAll}>{t.home.seeAll}</Text>
            </Pressable>
          </View>
          {openBills.length === 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/bills/new')}>
              <Text style={styles.empty}>{t.home.billsEmpty}</Text>
              <Text style={styles.seeAll}>{t.home.billsAdd}</Text>
            </Pressable>
          ) : (
            openBills.slice(0, 3).map((b, i) => {
              const info = dueInfo(b.due_date);
              return (
                <Pressable
                  key={b.id}
                  accessibilityRole="button"
                  onPress={() => router.push('/bills')}
                  style={[styles.billRow, i > 0 && styles.separator]}>
                  <View style={styles.flex}>
                    <Text style={styles.billName} numberOfLines={1}>
                      {b.name}
                    </Text>
                    <Text style={[styles.billDue, { color: STATUS_COLOR[info.status] }]}>{info.label}</Text>
                  </View>
                  <Text style={styles.billAmount}>{billAmountLabel(b)}</Text>
                </Pressable>
              );
            })
          )}
        </Card>

        {/* Destaque do mês */}
        <Insight
          month={month}
          onAction={() => (month.count === 0 ? router.push('/transaction/new') : router.push('/reports'))}
        />

        {/* Transações recentes */}
        <Card>
          <View style={styles.recentHeader}>
            <Text style={styles.cardTitleBig}>{t.home.recent}</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/transactions')} hitSlop={8}>
              <Text style={styles.seeAll}>{t.home.seeAll}</Text>
            </Pressable>
          </View>
          {data.length === 0 && !loading ? (
            <Text style={styles.empty}>{t.home.noTransactions}</Text>
          ) : (
            data.slice(0, 5).map((tx, i) => (
              <View key={tx.id} style={i > 0 ? styles.separator : undefined}>
                <TransactionRow tx={tx} />
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Insight({
  month,
  onAction,
}: {
  month: ReturnType<typeof monthSummary>;
  onAction: () => void;
}) {
  const h = t.home;
  let title: string = h.insightEmptyTitle;
  let body: string = h.insightEmptyBody;
  let action: string = h.insightEmptyAction;
  if (month.count > 0) {
    action = h.insightAction;
    if (month.income > 0 && month.expense > month.income) {
      title = h.insightOverTitle;
      body = h.insightOverBody(formatBRL(month.expense - month.income));
    } else if (month.top[0]) {
      title = h.insightTopTitle(month.top[0].name);
      body = h.insightTopBody(Math.round(month.top[0].share * 100));
    } else {
      title = h.insightEmptyTitle;
      body = h.insightEmptyBody;
    }
  }
  return (
    <View style={styles.insight}>
      <View style={styles.insightIcon}>
        <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightBody}>{body}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onAction} style={styles.insightButton}>
        <Text style={styles.insightButtonText}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 52, height: 52 },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.primary },
  hello: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  brand: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: colors.primary },

  actionsWrap: { marginHorizontal: -16 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  moreHint: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,249,251,0.92)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radius.sm,
  },
  chipPrimary: { backgroundColor: colors.primary },
  chipOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  chipText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },

  loading: { paddingVertical: 8 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, textAlign: 'center' },
  gap: { gap: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  balanceRow: { flexDirection: 'row' },
  balanceCol: { flex: 1, gap: 4 },
  balance: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: colors.text },
  net: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  netText: { fontFamily: fonts.semiBold, fontSize: 14 },
  netHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  ranges: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    gap: 2,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.sm,
  },
  range: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
  rangeOn: { backgroundColor: colors.primary },
  rangeText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  rangeTextOn: { fontFamily: fonts.semiBold, color: colors.onPrimary },
  hint: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSubtle },
  walletNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.outlineSoft },
  walletNoteText: { flex: 1, fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.textSubtle },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  billName: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.text },
  billDue: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  billAmount: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.text },

  twoCols: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  colWide: { flex: 1.5, gap: 12, padding: 16 },
  colNarrow: { flex: 1, gap: 12 },
  mini: { flex: 1, padding: 14, gap: 4, justifyContent: 'center' },
  smallTitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
  gaugeBox: { alignItems: 'center', paddingTop: 8 },
  legend: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
  legendName: { flex: 1, fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  legendValue: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.text },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, paddingVertical: 12 },
  miniValue: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 30, color: colors.text },
  miniSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary },
  miniWarn: { fontFamily: fonts.medium, fontSize: 11, color: colors.error },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceHighest, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.pill, backgroundColor: colors.primary },

  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.onPrimary },
  insightBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.85)' },
  insightButton: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface, borderRadius: radius.sm },
  insightButtonText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },

  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitleBig: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.text },
  seeAll: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
  separator: { borderTopWidth: 1, borderTopColor: colors.outlineSoft },
});
