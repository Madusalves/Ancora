import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRecentTransactions } from '@/features/home/api';
import { TransactionRow } from '@/features/home/TransactionRow';
import { t } from '@/i18n/pt-BR';
import { colors, fonts } from '@/theme';
import { useScreenLayout } from '@/theme/layout';

/** Lista simples das transações dos últimos 12 meses (não há design no Figma). */
export default function Transactions() {
  const { data, isLoading, isError } = useRecentTransactions();
  const layout = useScreenLayout();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: layout.gutter }]}>
        <Text style={styles.eyebrow}>{t.brand.toUpperCase()}</Text>
        <Text style={styles.title}>{t.tabs.transactions}</Text>
      </View>
      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.pad} /> : null}
      {isError ? <Text style={styles.error}>{t.home.loadError}</Text> : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(tx) => tx.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TransactionRow tx={item} />
          </View>
        )}
        ListEmptyComponent={isLoading ? undefined : <Text style={styles.empty}>{t.home.noTransactions}</Text>}
        contentContainerStyle={[styles.list, layout.content(24, true)]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16 },
  eyebrow: { fontFamily: fonts.semiBold, fontSize: 10, letterSpacing: 1, color: colors.textSubtle },
  title: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { borderBottomWidth: 1, borderBottomColor: colors.outlineSoft },
  pad: { padding: 16 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, textAlign: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 24 },
});
