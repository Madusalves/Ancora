import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useBills, useUpdateBill } from '@/features/bills/api';
import { BillForm } from '@/features/bills/BillForm';
import { parseDay } from '@/features/home/stats';
import { t } from '@/i18n/pt-BR';
import { colors } from '@/theme';

export default function EditBill() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bills = useBills();
  const update = useUpdateBill();
  const bill = bills.data?.find((b) => b.id === id);
  const missing = !bill && !bills.isLoading;

  // Conta inexistente (ex.: já excluída): volta para a lista.
  useEffect(() => {
    if (missing) router.back();
  }, [missing, router]);

  if (!bill) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <BillForm
      title={t.bills.editTitle}
      saveLabel={t.bills.form.saveChanges}
      initial={{
        name: bill.name,
        amount: bill.amount,
        due: parseDay(bill.due_date),
        categoryId: bill.category_id,
        recurring: bill.recurrence === 'monthly',
        variable: bill.variable,
      }}
      onSubmit={async (values) => {
        await update.mutateAsync({ id: bill.id, ...values });
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
