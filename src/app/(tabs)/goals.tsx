import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import {
  CategoryLimit,
  useBudget,
  useCategoryLimits,
  useDeleteLimit,
} from '@/features/goals/api';
import { limitStatus, monthSpend, STATUS_COLOR, STATUS_SOFT } from '@/features/goals/stats';
import { useRecentTransactions } from '@/features/home/api';
import { formatBRL } from '@/features/transactions/format';
import { CATEGORY_ICONS } from '@/features/transactions/icons';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius, createStyles } from '@/theme';
import { useScreenLayout } from '@/theme/layout';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Orçamentos e Limites (Figma 43:416): orçamento mensal total + teto por categoria. */
export default function Goals() {
  const router = useRouter();
  const layout = useScreenLayout();
  const budget = useBudget();
  const limits = useCategoryLimits();
  const txs = useRecentTransactions();
  const del = useDeleteLimit();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), [txs.dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const spend = useMemo(() => monthSpend(txs.data ?? [], now), [txs.data, now]);

  const rows = useMemo(
    () =>
      (limits.data ?? []).map((l) => {
        const spent = spend.byCategory.get(l.category.name) ?? 0;
        return { limit: l, spent, ratio: l.monthly_limit > 0 ? spent / l.monthly_limit : spent > 0 ? 1 : 0 };
      }),
    [limits.data, spend],
  );
  const worst = rows.filter((r) => r.ratio >= 0.85).sort((a, b) => b.ratio - a.ratio)[0];

  const total = budget.data ?? 0;
  const totalRatio = total > 0 ? spend.total / total : 0;
  const totalStatus = limitStatus(totalRatio);
  const loading = budget.isLoading || limits.isLoading || txs.isLoading;
  const failed = budget.isError || limits.isError || txs.isError;

  const edit = (l: CategoryLimit) => {
    setMenuId(null);
    router.push({ pathname: '/limit', params: { target: l.category_id } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, layout.content(32, true)]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.brand}>{t.brand.toUpperCase()}</Text>
            <Text style={styles.title}>{t.goals.title}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/limit')} style={styles.createBtn}>
            <Ionicons name="add" size={18} color={colors.onPrimary} />
            <Text style={styles.createText}>{t.goals.create}</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} style={styles.pad} /> : null}
        {failed ? <Text style={styles.error}>{t.goals.loadError}</Text> : null}

        {/* Orçamento mensal total */}
        <Card style={styles.budgetCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>{t.goals.totalTitle}</Text>
            <View style={styles.monthBadge}>
              <Ionicons name="calendar-outline" size={12} color={colors.primary} />
              <Text style={styles.monthText}>{MONTHS[now.getMonth()]}</Text>
            </View>
          </View>

          {total > 0 ? (
            <>
              <Text style={styles.bigValue}>{formatBRL(total)}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.muted}>{t.goals.consumed(Math.round(totalRatio * 100))}</Text>
                <Text style={[styles.remaining, { color: STATUS_COLOR[totalStatus] }]}>
                  {spend.total <= total
                    ? t.goals.remaining(formatBRL(total - spend.total))
                    : t.goals.exceeded(formatBRL(spend.total - total))}
                </Text>
              </View>
              <Bar ratio={totalRatio} color={STATUS_COLOR[totalStatus]} />
            </>
          ) : (
            <Text style={styles.muted}>{t.goals.noBudget}</Text>
          )}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t.goals.totalSpent}</Text>
              <Text style={styles.statValue}>{formatBRL(spend.total)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t.goals.dailyAvg}</Text>
              <Text style={styles.statValue}>{formatBRL(spend.dailyAvg)}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/limit', params: { target: 'total' } })}
            hitSlop={8}>
            <Text style={styles.link}>{total > 0 ? t.goals.editBudget : t.goals.setBudget}</Text>
          </Pressable>
        </Card>

        {/* Alerta */}
        {worst ? (
          <View style={[styles.alert, worst.ratio >= 1 && styles.alertOver]}>
            <Ionicons name="warning-outline" size={20} color={worst.ratio >= 1 ? colors.error : colors.warning} />
            <View style={styles.flex}>
              <Text style={[styles.alertTitle, { color: worst.ratio >= 1 ? colors.error : colors.warning }]}>
                {t.goals.alertTitle}
              </Text>
              <Text style={styles.alertBody}>
                {(worst.ratio >= 1 ? t.goals.alertOver : t.goals.alertNear)(worst.limit.category.name, Math.round(worst.ratio * 100))}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Limites por categoria */}
        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.sectionTitle}>{t.goals.categoriesTitle}</Text>
            <Text style={styles.muted}>{t.goals.configured(rows.length)}</Text>
          </View>
          <Pressable accessibilityRole="link" onPress={() => router.push('/limit')} hitSlop={8}>
            <Text style={styles.link}>{t.goals.configure}</Text>
          </Pressable>
        </View>

        {!loading && rows.length === 0 ? <Text style={styles.empty}>{t.goals.empty}</Text> : null}

        {rows.map(({ limit, spent, ratio }) => {
          const status = limitStatus(ratio);
          const color = STATUS_COLOR[status];
          const ic = CATEGORY_ICONS[limit.category.icon];
          return (
            <View key={limit.id} style={styles.limitCard}>
              <View style={styles.limitTop}>
                <View style={[styles.tile, { backgroundColor: STATUS_SOFT[status] }]}>
                  {ic ? (
                    <Image source={ic.source} style={{ width: ic.width, height: ic.height }} contentFit="contain" />
                  ) : (
                    <Ionicons name="pricetag-outline" size={18} color={color} />
                  )}
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.limitName} numberOfLines={1}>
                      {limit.category.name}
                    </Text>
                    <View style={[styles.pct, { backgroundColor: STATUS_SOFT[status] }]}>
                      <Text style={[styles.pctText, { color }]}>{Math.round(ratio * 100)}%</Text>
                    </View>
                  </View>
                  {limit.category.description ? (
                    <Text style={styles.sub} numberOfLines={1}>
                      {limit.category.description}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.goals.menu}
                  onPress={() => {
                    setConfirmId(null);
                    setMenuId(menuId === limit.id ? null : limit.id);
                  }}
                  hitSlop={8}>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.textSubtle} />
                </Pressable>
              </View>

              <Bar ratio={ratio} color={color} />

              <View style={styles.rowBetween}>
                <Text style={styles.muted}>
                  {t.goals.spent}: <Text style={styles.strong}>{formatBRL(spent)}</Text>
                </Text>
                <Text style={styles.muted}>
                  {t.goals.limit}: <Text style={styles.strong}>{formatBRL(limit.monthly_limit)}</Text>
                </Text>
              </View>

              {menuId === limit.id ? (
                <View style={styles.menu}>
                  <Pressable accessibilityRole="button" onPress={() => edit(limit)} hitSlop={8}>
                    <Text style={styles.link}>{t.goals.edit}</Text>
                  </Pressable>
                  {confirmId === limit.id ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setMenuId(null);
                        setConfirmId(null);
                        del.mutate(limit.id);
                      }}>
                      <Text style={styles.removeConfirm}>{t.goals.confirmRemove}</Text>
                    </Pressable>
                  ) : (
                    <Pressable accessibilityRole="button" onPress={() => setConfirmId(limit.id)} hitSlop={8}>
                      <Text style={styles.remove}>{t.goals.remove}</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Bar({ ratio, color }: { ratio: number; color: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(Math.max(ratio, 0), 1) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = createStyles(() => ({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 1, color: colors.textSubtle },
  title: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  createText: { fontFamily: fonts.semiBold, fontSize: 12, letterSpacing: 0.3, color: colors.onPrimary },
  pad: { padding: 12 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, textAlign: 'center' },

  budgetCard: { gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.primaryContainerTint,
    borderRadius: radius.pill,
  },
  monthText: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.primary },
  bigValue: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 40, letterSpacing: -0.8, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  strong: { fontFamily: fonts.semiBold, color: colors.text },
  remaining: { fontFamily: fonts.semiBold, fontSize: 12 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  stats: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stat: { flex: 1, gap: 2, padding: 12, backgroundColor: colors.surfaceLow, borderRadius: radius.sm },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  statValue: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.text },
  link: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },

  alert: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: `${colors.warning}66`,
    borderRadius: radius.md,
  },
  alertOver: { backgroundColor: colors.errorSoft, borderColor: `${colors.error}66` },
  alertTitle: { fontFamily: fonts.semiBold, fontSize: 13 },
  alertBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.text },

  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 18, lineHeight: 24, color: colors.text },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 24 },

  limitCard: {
    padding: 16,
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.md,
  },
  limitTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  limitName: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 15, color: colors.text },
  pct: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill },
  pctText: { fontFamily: fonts.semiBold, fontSize: 11 },
  sub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSubtle },
  menu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.outlineSoft,
  },
  remove: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle },
  removeConfirm: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.error },
}));
