import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { deleteAccount, signOut } from '@/features/auth/actions';
import { useBills } from '@/features/bills/api';
import { useMe, useRecentTransactions, useUpdateName } from '@/features/home/api';
import { monthSummary } from '@/features/home/stats';
import { resetTour } from '@/features/tour/storage';
import { useAccounts } from '@/features/transactions/api';
import { formatBRL } from '@/features/transactions/format';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius, createStyles, getScheme } from '@/theme';
import { useScreenLayout } from '@/theme/layout';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Meu Perfil: dados da conta, resumo financeiro e atalhos de configuração. */
export default function Profile() {
  const router = useRouter();
  const layout = useScreenLayout();
  const copy = t.profile;
  const me = useMe();
  const accounts = useAccounts();
  const txs = useRecentTransactions();
  const bills = useBills();
  const updateName = useUpdateName();
  const queryClient = useQueryClient();

  const [nameOpen, setNameOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const tipShown = useRef(false);

  // Dica automática (uma vez por visita) quando o nome ainda vem do e-mail.
  useEffect(() => {
    if (me.data && !me.data.hasName && !tipShown.current) {
      tipShown.current = true;
      setDraft('');
      setNameOpen(true);
    }
  }, [me.data]);

  const openName = () => {
    setDraft(me.data?.hasName ? me.data.fullName : '');
    updateName.reset();
    setNameOpen(true);
  };
  const saveName = () => {
    if (!draft.trim()) return;
    updateName.mutate(draft, { onSuccess: () => setNameOpen(false) });
  };

  const balance = (accounts.data ?? []).reduce((s, a) => s + a.balance, 0);
  const openBills = (bills.data ?? []).filter((b) => !b.paid_at).length;
  const month = useMemo(() => monthSummary(txs.data ?? [], new Date()), [txs.data]);
  const savings = Math.max(0, Math.round(month.savingsRate * 100));

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));
  const logout = async () => {
    await signOut();
    router.replace('/login');
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteFailed(false);
    const result = await deleteAccount();
    setDeleting(false);
    if (!result.ok) {
      setDeleteFailed(true);
      return;
    }
    setDeleteOpen(false);
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.back} onPress={goBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{copy.title}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, layout.content(32)]} showsVerticalScrollIndicator={false}>
        {/* Identidade */}
        <Card style={styles.identity}>
          {me.data?.avatarUrl ? (
            <Image source={{ uri: me.data.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{me.data?.initials || '·'}</Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.editName}
            onPress={openName}
            style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {me.data?.fullName ?? ''}
            </Text>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </Pressable>
          <Text style={styles.email} numberOfLines={1}>
            {me.data?.email ?? ''}
          </Text>
        </Card>

        {/* Resumo */}
        <View style={styles.stats}>
          <Stat icon="wallet-outline" label={copy.statBalance} value={formatBRL(balance)} />
          <Stat
            icon="calendar-outline"
            label={copy.statBills}
            value={`${openBills} ${copy.statBillsUnit(openBills)}`}
          />
          <Stat icon="trending-up" label={copy.statSavings} value={`${savings}%`} />
        </View>

        {/* Conta e segurança */}
        <Text style={styles.section}>{copy.accountSection}</Text>
        <Card style={styles.group}>
          <Row icon="person-outline" title={copy.personal} subtitle={copy.personalSub} onPress={openName} />
          <Row
            icon="shield-checkmark-outline"
            title={copy.security}
            subtitle={copy.securitySub}
            onPress={() => router.push('/set-password')}
            separated
          />
        </Card>

        {/* Preferências */}
        <Text style={styles.section}>{copy.prefsSection}</Text>
        <Card style={styles.group}>
          <Row
            icon="notifications-outline"
            title={copy.notifications}
            subtitle={copy.notificationsSub}
            onPress={() => router.push('/bills')}
          />
          <Row icon="globe-outline" title={copy.currency} subtitle={copy.currencySub} separated />
          <Row
            icon="help-circle-outline"
            title={t.tour.replay}
            subtitle={t.tour.replaySub}
            onPress={async () => {
              await resetTour();
              router.replace('/home');
            }}
            separated
          />
        </Card>

        <Pressable accessibilityRole="button" onPress={logout} style={styles.signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.signOutText}>{copy.signOut}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setDeleteFailed(false);
            setDeleteOpen(true);
          }}
          style={styles.deleteLink}>
          <Text style={styles.deleteLinkText}>{copy.deleteAccount}</Text>
        </Pressable>
        <Text style={styles.version}>
          {copy.version} {Constants.expoConfig?.version ?? ''}
        </Text>
      </ScrollView>

      <Modal visible={nameOpen} transparent animationType="fade" onRequestClose={() => setNameOpen(false)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
          <View style={styles.dialog}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.dialogTitle}>{copy.nameTipTitle}</Text>
            <Text style={styles.dialogBody}>{copy.nameTipBody}</Text>
            <Text style={styles.inputLabel}>{copy.nameLabel}</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={copy.namePlaceholder}
              placeholderTextColor={colors.textSubtle}
              keyboardAppearance={getScheme()}
              cursorColor={colors.primary}
              autoCapitalize="words"
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={saveName}
              style={styles.input}
            />
            {updateName.isError ? <Text style={styles.dialogError}>{copy.nameError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={!draft.trim() || updateName.isPending}
              onPress={saveName}
              style={[styles.saveBtn, (!draft.trim() || updateName.isPending) && styles.saveBtnOff]}>
              <Text style={styles.saveText}>{copy.nameSave}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setNameOpen(false)} style={styles.skipBtn}>
              <Text style={styles.skipText}>{copy.nameSkip}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <View style={[styles.tipIcon, styles.dangerIcon]}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </View>
            <Text style={styles.dialogTitle}>{copy.deleteTitle}</Text>
            <Text style={styles.dialogBody}>{copy.deleteBody}</Text>
            {deleteFailed ? <Text style={styles.dialogError}>{copy.deleteError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={confirmDelete}
              style={[styles.saveBtn, styles.dangerBtn, deleting && styles.saveBtnOff]}>
              <Text style={styles.saveText}>{copy.deleteConfirm}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={() => setDeleteOpen(false)}
              style={styles.skipBtn}>
              <Text style={styles.skipText}>{copy.deleteCancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  separated,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress?: () => void;
  separated?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, separated && styles.separator]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      ) : (
        <Text style={styles.soon}>{t.profile.soon}</Text>
      )}
    </Pressable>
  );
}

const styles = createStyles(() => ({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.text },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 12 },

  identity: { alignItems: 'center', gap: 4, paddingVertical: 24 },
  avatar: { width: 88, height: 88, borderRadius: radius.pill, marginBottom: 8 },
  avatarFallback: { backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  name: { flexShrink: 1, fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28, color: colors.text },

  backdrop: { flex: 1, backgroundColor: colors.backdrop, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: 24, padding: 24, gap: 8 },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryContainerTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.text, marginTop: 4 },
  dialogBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  inputLabel: { marginTop: 8, fontFamily: fonts.semiBold, fontSize: 12, color: colors.textSubtle },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  dialogError: { fontFamily: fonts.medium, fontSize: 12, color: colors.error },
  saveBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnOff: { opacity: 0.5 },
  saveText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.onPrimary },
  skipBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textMuted },
  email: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },

  stats: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    gap: 4,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.md,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryContainerTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSubtle },
  statValue: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.text },

  section: {
    marginTop: 8,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textSubtle,
  },
  group: { padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12 },
  separator: { borderTopWidth: 1, borderTopColor: colors.outlineSoft },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  soon: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSubtle },

  signOut: {
    marginTop: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.errorSoft,
    borderRadius: radius.md,
  },
  signOutText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.error },
  deleteLink: { height: 40, alignItems: 'center', justifyContent: 'center' },
  deleteLinkText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSubtle, textDecorationLine: 'underline' },
  dangerIcon: { backgroundColor: colors.errorSoft },
  dangerBtn: { backgroundColor: colors.error },
  version: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 11, color: colors.textSubtle },
}));
