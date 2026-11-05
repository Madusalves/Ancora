import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { parseDay } from '@/features/home/stats';
import { billAmountLabel } from './format';
import { t } from '@/i18n/pt-BR';

import type { Bill } from './api';

const CHANNEL = 'bills';
const REMIND_HOUR = 9; // 09:00, horário local
const MAX_SCHEDULED = 60; // o iOS aceita no máximo 64 notificações agendadas

const supported = Platform.OS !== 'web';
let configured = false;

/** Chame uma vez: mostra o aviso mesmo com o app aberto e cria o canal no Android. */
export function configureNotifications() {
  if (!supported || configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: t.bills.channel,
      importance: AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

/** Pede permissão (só pergunta se ainda não foi decidido). */
export async function requestReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

function at(dueDate: string, daysBefore: number): Date {
  const d = parseDay(dueDate);
  d.setDate(d.getDate() - daysBefore);
  d.setHours(REMIND_HOUR, 0, 0, 0);
  return d;
}

export type Reminder = { bill: Bill; date: Date; today: boolean };

/** Quais lembretes agendar: 1 dia antes e no dia, às 09:00, só no futuro, em ordem, até o limite. */
export function planReminders(bills: Bill[], now = new Date()): Reminder[] {
  return bills
    .filter((b) => !b.paid_at)
    .flatMap((b) => [
      { bill: b, date: at(b.due_date, 1), today: false },
      { bill: b, date: at(b.due_date, 0), today: true },
    ])
    .filter((r) => r.date.getTime() > now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);
}

/**
 * Reagenda os lembretes de todas as contas em aberto.
 * O app só tem esses lembretes, então limpa tudo e agenda de novo (idempotente).
 */
export async function syncBillReminders(bills: Bill[], now = new Date()): Promise<number> {
  if (!supported) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const reminders = planReminders(bills, now);
  for (const { bill, date, today } of reminders) {
    const n = t.bills.notification;
    const value = billAmountLabel(bill);
    const body =
      bill.amount === null
        ? today
          ? n.todayNoValue(bill.name)
          : n.tomorrowNoValue(bill.name)
        : today
          ? n.today(bill.name, value)
          : n.tomorrow(bill.name, value);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: n.title,
        body,
        data: { billId: bill.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
  return reminders.length;
}
