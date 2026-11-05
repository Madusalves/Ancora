import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useEffect } from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton } from '@/components/TabButton';
import { useBills } from '@/features/bills/api';
import { configureNotifications, syncBillReminders } from '@/features/bills/notifications';
import { t } from '@/i18n/pt-BR';
import { colors, createStyles } from '@/theme';

/** Navegação principal: Início, Transações, Metas e Relatórios. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bills = useBills();

  useEffect(() => configureNotifications(), []);

  // Mantém os lembretes de vencimento em dia sempre que a lista de contas muda.
  useEffect(() => {
    if (bills.data) syncBillReminders(bills.data).catch(() => {});
  }, [bills.data]);

  return (
    <Tabs style={styles.root}>
      <TabSlot />
      <TabList style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TabTrigger name="home" href="/home" asChild>
          <TabButton label={t.tabs.home} icon="home-outline" iconActive="home" />
        </TabTrigger>
        <TabTrigger name="transactions" href="/transactions" asChild>
          <TabButton tourId="tab-transactions" label={t.tabs.transactions} icon="wallet-outline" iconActive="wallet" />
        </TabTrigger>
        <TabTrigger name="goals" href="/goals" asChild>
          <TabButton tourId="tab-goals" label={t.tabs.goals} icon="radio-button-on-outline" iconActive="radio-button-on" />
        </TabTrigger>
        <TabTrigger name="reports" href="/reports" asChild>
          <TabButton tourId="tab-reports" label={t.tabs.reports} icon="bar-chart-outline" iconActive="bar-chart" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = createStyles(() => ({
  root: { flex: 1, backgroundColor: colors.background },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineSoft,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    boxShadow: '0px -4px 12px rgba(15,23,42,0.05)',
  },
}));
