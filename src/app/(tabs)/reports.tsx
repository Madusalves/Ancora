import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { DateField } from '@/components/DateField';
import { useRecentTransactions } from '@/features/home/api';
import {
  analyze,
  formatPercent,
  formatPercentDelta,
  getPeriod,
  inPeriod,
  MODES,
  SAVINGS_GOAL,
  shiftAnchor,
  type Mode,
} from '@/features/reports/analysis';
import { CashFlowChart, Donut, FLOW_EXPENSE, FLOW_INCOME, SLICE_COLORS } from '@/features/reports/Charts';
import { exportPdf, exportSheet } from '@/features/reports/export';
import { formatBRL, formatDecimal } from '@/features/transactions/format';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius } from '@/theme';
import { useScreenLayout } from '@/theme/layout';

type Format = 'pdf' | 'csv';

/** Relatórios & Análise (Figma 43:152). */
export default function Reports() {
  const layout = useScreenLayout();
  const txs = useRecentTransactions();
  const [mode, setMode] = useState<Mode>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [custom, setCustom] = useState(() => {
    const to = new Date();
    return { from: new Date(to.getFullYear(), to.getMonth(), 1), to };
  });
  const [showNote, setShowNote] = useState(false);
  const [format, setFormat] = useState<Format>('pdf');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), [txs.dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const data = useMemo(() => txs.data ?? [], [txs.data]);
  const period = useMemo(() => getPeriod(mode, anchor, custom), [mode, anchor, custom]);
  const a = useMemo(() => analyze(data, mode, anchor, period, today), [data, mode, anchor, period, today]);

  const lastFlow = a.cashFlow[a.cashFlow.length - 1];
  const monthNet = lastFlow.income - lastFlow.expense;
  const goalHit = a.income > 0 && a.savingsRate >= SAVINGS_GOAL;

  const run = async (f: Format) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (f === 'pdf') await exportPdf(period, a);
      else await exportSheet(period, inPeriod(data, period));
    } catch (e) {
      console.warn('Falha ao exportar', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const other: Format = format === 'pdf' ? 'csv' : 'pdf';
  const label = (f: Format, primary: boolean) =>
    f === 'pdf' ? (primary ? t.reports.exportPdf : t.reports.downloadPdf) : primary ? t.reports.exportCsv : t.reports.downloadCsv;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, layout.content(24, true)]} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>{t.reports.eyebrow.toUpperCase()}</Text>
            <Text style={styles.title}>{t.reports.title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label(format, true)}
            onPress={() => run(format)}
            style={styles.iconButton}>
            <Ionicons name="download-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Modo do período */}
        <View style={styles.segment}>
          {MODES.map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: m === mode }}
              onPress={() => {
                setMode(m);
                setAnchor(new Date());
              }}
              style={[styles.segmentItem, m === mode && styles.segmentOn]}>
              <Text style={[styles.segmentText, m === mode && styles.segmentTextOn]} numberOfLines={1}>
                {t.reports.modes[m]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Navegação de período */}
        {mode === 'custom' ? (
          <View style={styles.customRow}>
            <View style={styles.flex}>
              <Text style={styles.customLabel}>{t.reports.from}</Text>
              <DateField value={custom.from} onChange={(from) => setCustom((c) => ({ ...c, from }))} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.customLabel}>{t.reports.to}</Text>
              <DateField value={custom.to} onChange={(to) => setCustom((c) => ({ ...c, to }))} />
            </View>
          </View>
        ) : (
          <View style={styles.periodBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.reports.prev}
              hitSlop={10}
              onPress={() => setAnchor((d) => shiftAnchor(mode, d, -1))}>
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.periodText}>{period.label}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.reports.next}
              hitSlop={10}
              onPress={() => setAnchor((d) => shiftAnchor(mode, d, 1))}>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {txs.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {txs.isError ? <Text style={styles.error}>{t.home.loadError}</Text> : null}

        {/* KPIs */}
        <View style={styles.kpis}>
          <Card style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t.reports.dailyAvg}</Text>
            <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
              R$ {formatDecimal(a.dailyAverage)}
            </Text>
            {a.dailyDelta !== null ? (
              <View style={styles.kpiSub}>
                <Ionicons
                  name={a.dailyDelta > 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={a.dailyDelta > 0 ? colors.error : colors.primary}
                />
                <Text style={[styles.kpiSubText, { color: a.dailyDelta > 0 ? colors.error : colors.primary }]}>
                  {formatPercentDelta(a.dailyDelta)}
                </Text>
              </View>
            ) : null}
          </Card>
          <Card style={[styles.kpi, goalHit && styles.kpiHighlight]}>
            <Text style={[styles.kpiLabel, goalHit && { color: colors.primary }]}>{t.reports.saved}</Text>
            <Text style={[styles.kpiValue, { color: a.savingsRate < 0 ? colors.error : colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatPercent(a.savingsRate)}
            </Text>
            <Text style={styles.kpiSubText}>{t.reports.goal(Math.round(SAVINGS_GOAL * 100))}</Text>
          </Card>
          <Card style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t.reports.biggest}</Text>
            <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
              {a.biggest ? `R$ ${formatDecimal(a.biggest.amount)}` : '—'}
            </Text>
            <Text style={styles.kpiSubText} numberOfLines={1}>
              {a.biggest?.description ?? ' '}
            </Text>
          </Card>
        </View>

        {/* Distribuição de despesas */}
        <Card style={styles.gap}>
          <View style={styles.cardHeader}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{t.reports.distribution}</Text>
              <Text style={styles.cardSub}>{t.reports.totalSpent(formatBRL(a.expense))}</Text>
            </View>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setShowNote((v) => !v)}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSubtle} />
            </Pressable>
          </View>
          {showNote ? <Text style={styles.note}>{t.reports.distributionNote}</Text> : null}
          {a.expense > 0 ? (
            <View style={styles.donutRow}>
              <Donut shares={a.slices.map((s) => s.share)} centerValue="100%" centerLabel={t.reports.outflows} />
              <View style={styles.legend}>
                {a.slices.map((s, i) => (
                  <View key={s.name} style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }]} />
                    <Text style={styles.legendName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.legendValue}>{Math.round(s.share * 100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>{t.reports.noExpenses}</Text>
          )}
        </Card>

        {/* Fluxo de caixa */}
        <Card style={styles.gap}>
          <View style={styles.cardHeader}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{t.reports.cashFlow}</Text>
              <Text style={styles.cardSub}>{t.reports.cashFlowSub}</Text>
            </View>
          </View>
          <View style={styles.flowLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: FLOW_INCOME }]} />
              <Text style={styles.legendName}>{t.reports.income}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: FLOW_EXPENSE }]} />
              <Text style={styles.legendName}>{t.reports.expense}</Text>
            </View>
          </View>
          <CashFlowChart items={a.cashFlow} />
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>{t.reports.netMonth}</Text>
            <Text style={[styles.netValue, { color: monthNet < 0 ? colors.error : colors.primary }]}>
              {monthNet < 0 ? '-' : '+'}R$ {formatDecimal(Math.abs(monthNet))}
            </Text>
          </View>
        </Card>

        {/* Exportação */}
        <Card style={styles.gap}>
          <View>
            <Text style={styles.cardTitle}>{t.reports.exportTitle}</Text>
            <Text style={styles.cardSub}>{t.reports.exportSub}</Text>
          </View>

          <View style={styles.options}>
            <FormatOption
              icon="document-text-outline"
              title={t.reports.fullReport}
              sub={t.reports.fullReportSub}
              selected={format === 'pdf'}
              onPress={() => setFormat('pdf')}
            />
            <FormatOption
              icon="grid-outline"
              title={t.reports.sheet}
              sub={t.reports.sheetSub}
              selected={format === 'csv'}
              onPress={() => setFormat('csv')}
            />
          </View>

          <DisabledOption label={t.reports.receipts} icon="receipt-outline" />
          <DisabledOption label={t.reports.password} icon="lock-closed-outline" />

          {error ? <Text style={styles.error}>{t.reports.exportError} ({error})</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => run(format)}
            style={({ pressed }) => [styles.primaryButton, (pressed || busy) && styles.pressed]}>
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.onPrimary} />
                <Text style={styles.primaryText}>{label(format, true)}</Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => run(other)}
            style={({ pressed }) => [styles.outlineButton, (pressed || busy) && styles.pressed]}>
            <Ionicons name={other === 'csv' ? 'document-outline' : 'document-text-outline'} size={18} color={colors.textMuted} />
            <Text style={styles.outlineText}>{label(other, false)}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function FormatOption({
  icon,
  title,
  sub,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionOn]}>
      <View style={styles.optionTop}>
        <View style={[styles.optionIcon, selected && styles.optionIconOn]}>
          <Ionicons name={icon} size={18} color={selected ? colors.primary : colors.textMuted} />
        </View>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </View>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionSub}>{sub}</Text>
    </Pressable>
  );
}

/** Opções do design que ainda não existem no app: mostradas desabilitadas. */
function DisabledOption({ label, icon }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={styles.checkRow} accessibilityState={{ disabled: true }}>
      <Ionicons name={icon} size={18} color={colors.textSubtle} />
      <Text style={[styles.checkText, styles.flex]}>{label}</Text>
      <Text style={styles.soon}>{t.reports.soon}</Text>
      <View style={styles.checkbox} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 16 },
  gap: { gap: 16 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, textAlign: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, paddingVertical: 12 },
  pressed: { opacity: 0.7 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 1, color: colors.textSubtle },
  title: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segment: {
    flexDirection: 'row',
    padding: 3,
    gap: 2,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.sm,
  },
  segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.surface, boxShadow: '0px 1px 2px rgba(0,0,0,0.08)' },
  segmentText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  segmentTextOn: { fontFamily: fonts.semiBold, color: colors.primary },

  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.sm,
  },
  periodText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  customRow: { flexDirection: 'row', gap: 12 },
  customLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginBottom: 4 },

  kpis: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, padding: 12, gap: 4 },
  kpiHighlight: { backgroundColor: colors.primaryContainerTint, borderColor: colors.primary },
  kpiLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSubtle },
  kpiValue: { fontFamily: fonts.displayBold, fontSize: 17, lineHeight: 22, color: colors.text },
  kpiSub: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  kpiSubText: { fontFamily: fonts.medium, fontSize: 10, color: colors.textSubtle },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.text },
  cardSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.textSubtle },
  donutRow: { gap: 16 },
  legend: { gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  legendName: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  legendValue: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
  flowLegend: { flexDirection: 'row', gap: 16 },

  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineSoft,
  },
  netLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  netValue: { fontFamily: fonts.semiBold, fontSize: 13 },

  options: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  optionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconOn: { backgroundColor: colors.primaryContainer },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  optionTitle: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.text },
  optionSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.55 },
  checkText: { fontFamily: fonts.regular, fontSize: 13, color: colors.text },
  soon: { fontFamily: fonts.semiBold, fontSize: 10, color: colors.textSubtle },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: colors.outline },

  primaryButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    boxShadow: '0px 4px 5px rgba(0,105,72,0.2)',
  },
  primaryText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.onPrimary },
  outlineButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surfaceLow,
  },
  outlineText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textMuted },
});
