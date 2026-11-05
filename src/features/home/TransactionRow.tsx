import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { formatDecimal } from '@/features/transactions/format';
import { CATEGORY_ICONS } from '@/features/transactions/icons';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius, createStyles } from '@/theme';

import { parseDay, type Tx } from './stats';

const pad = (n: number) => String(n).padStart(2, '0');

/** "Hoje, 10:42" · "Ontem, 16:15" · "03/10, 09:00" */
export function whenLabel(tx: Tx, now = new Date()): string {
  const day = parseDay(tx.occurred_on);
  const created = new Date(tx.created_at);
  const time = `${pad(created.getHours())}:${pad(created.getMinutes())}`;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  const label =
    diff === 0
      ? t.home.today
      : diff === 1
        ? t.home.yesterday
        : `${pad(day.getDate())}/${pad(day.getMonth() + 1)}`;
  return `${label}, ${time}`;
}

export function TransactionRow({ tx }: { tx: Tx }) {
  const income = tx.type === 'income';
  const ic = tx.category ? CATEGORY_ICONS[tx.category.icon] : undefined;
  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: income ? colors.incomeSoft : colors.expenseSoft }]}>
        {ic ? (
          <Image source={ic.source} style={{ width: ic.width, height: ic.height }} contentFit="contain" />
        ) : (
          <Ionicons name="swap-horizontal" size={20} color={colors.textMuted} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {tx.description}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {whenLabel(tx)} • {tx.category?.name ?? t.home.uncategorized}
        </Text>
      </View>
      <Text style={[styles.amount, income ? styles.amountIncome : styles.amountExpense]}>
        {income ? '+' : '-'} R$ {formatDecimal(tx.amount)}
      </Text>
    </View>
  );
}

const styles = createStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  tile: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  amount: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.text, textAlign: 'right' },
  amountExpense: { color: colors.expense },
  amountIncome: { color: colors.income },
}));
