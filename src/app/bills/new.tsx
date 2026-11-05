import { useRouter } from 'expo-router';

import { useCreateBill } from '@/features/bills/api';
import { BillForm } from '@/features/bills/BillForm';
import { requestReminderPermission } from '@/features/bills/notifications';
import { t } from '@/i18n/pt-BR';

export default function NewBill() {
  const router = useRouter();
  const create = useCreateBill();
  return (
    <BillForm
      title={t.bills.form.title}
      saveLabel={t.bills.form.save}
      onSubmit={async (bill) => {
        await create.mutateAsync(bill);
        // Pede permissão de notificações na primeira conta; os lembretes são agendados
        // pelo layout das abas assim que a lista de contas é atualizada.
        await requestReminderPermission();
        router.back();
      }}
    />
  );
}
