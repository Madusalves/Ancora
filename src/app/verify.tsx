import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { needsPassword, sendEmailCode, verifyEmailCode } from '@/features/auth/actions';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius, createStyles } from '@/theme';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const arrow = require('../../assets/icons/arrow-right-12.svg');

const KEYS: { digit: string; letters: string }[] = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
];

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * Verificação do código (Figma 43:729).
 * Ícones provisórios (Ionicons): o limite de chamadas do Figma MCP impediu baixar os originais.
 */
export default function Verify() {
  const router = useRouter();
  const { email = '', mode, reset } = useLocalSearchParams<{ email: string; mode?: string; reset?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const press = useCallback((d: string) => {
    setError('');
    setCode((c) => (c.length < CODE_LENGTH ? c + d : c));
  }, []);
  const erase = useCallback(() => {
    setError('');
    setCode((c) => c.slice(0, -1));
  }, []);

  const confirm = async () => {
    if (busy || code.length < CODE_LENGTH) return;
    setBusy(true);
    const result = await verifyEmailCode(email, code);
    setBusy(false);
    if (result.ok) {
      router.replace(reset === '1' || (await needsPassword()) ? '/set-password' : '/home');
    } else {
      setError(result.message);
      setCode('');
    }
  };

  const resend = async () => {
    if (seconds > 0 || busy) return;
    setBusy(true);
    const result = await sendEmailCode(email, mode === 'register');
    setBusy(false);
    if (result.ok) {
      setSeconds(RESEND_SECONDS);
      setError('');
    } else {
      setError(result.message);
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t.onboarding.back} onPress={goBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerBrand}>{t.brand}</Text>
        <Ionicons name="help-circle-outline" size={24} color={colors.text} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <Ionicons name="mail-open" size={40} color={colors.primary} />
          <View style={styles.shield}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>{t.verify.title}</Text>
        <Text style={styles.subtitle}>{t.verify.sentTo}</Text>

        <View style={styles.pill}>
          <Text style={styles.pillEmail} numberOfLines={1}>
            {email}
          </Text>
          <Pressable onPress={goBack} hitSlop={8} style={styles.pillAction}>
            <Text style={styles.pillActionText}>{t.verify.change}</Text>
            <Ionicons name="pencil" size={11} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.codeLabel}>{t.verify.codeLabel}</Text>
        <View style={styles.boxes} accessibilityLabel={t.verify.codeLabel}>
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const active = i === code.length;
            return (
              <View key={i} style={[styles.box, (active || i < code.length) && styles.boxFilled, active && styles.boxActive]}>
                <Text style={styles.boxText}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
        </View>

        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Text style={styles.resendText}>
          {t.verify.didntReceive}{' '}
          <Text style={styles.resendTimer}>
            {seconds > 0 ? `${t.verify.resendIn} ${mmss(seconds)}` : ''}
          </Text>
        </Text>
        <Pressable onPress={resend} disabled={seconds > 0 || busy} hitSlop={8}>
          <Text style={[styles.resendLink, seconds === 0 && styles.resendLinkActive]}>{t.verify.resend}</Text>
        </Pressable>

        <Button
          label={t.verify.confirm}
          icon={arrow}
          iconSize={{ width: 12, height: 12 }}
          onPress={confirm}
          style={[styles.confirm, (code.length < CODE_LENGTH || busy) && styles.disabled]}
        />

        <View style={styles.secure}>
          <Ionicons name="lock-closed" size={16} color={colors.primary} style={styles.secureIcon} />
          <View style={styles.flex}>
            <Text style={styles.secureTitle}>{t.verify.secureTitle}</Text>
            <Text style={styles.secureBody}>{t.verify.secureBody}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.keypad}>
        <View style={styles.keyGrid}>
          {KEYS.map(({ digit, letters }) => (
            <Pressable key={digit} style={styles.key} onPress={() => press(digit)} accessibilityLabel={digit}>
              <Text style={styles.keyDigit}>{digit}</Text>
              <Text style={styles.keyLetters}>{letters}</Text>
            </Pressable>
          ))}
          <View style={styles.key} />
          <Pressable style={styles.key} onPress={() => press('0')} accessibilityLabel="0">
            <Text style={styles.keyDigit}>0</Text>
          </Pressable>
          <Pressable style={styles.key} onPress={erase} accessibilityLabel="Apagar">
            <Ionicons name="backspace-outline" size={26} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.help}>
          {t.verify.help} <Text style={styles.helpLink}>{t.verify.contact}</Text>
        </Text>
      </View>
    </SafeAreaView>
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
    paddingVertical: 12,
  },
  headerBrand: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
    color: colors.primary,
  },
  scroll: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  badge: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  shield: {
    position: 'absolute',
    right: -4,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 2px rgba(0,0,0,0.15)',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.pill,
    marginBottom: 24,
  },
  pillEmail: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 14, color: colors.text },
  pillAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pillActionText: { fontFamily: fonts.semiBold, fontSize: 12, color: colors.primary },
  codeLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 8,
  },
  boxes: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  box: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.sm,
  },
  boxFilled: { borderColor: colors.primary },
  boxActive: { borderWidth: 2 },
  boxText: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.text },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.error, marginBottom: 8, textAlign: 'center' },
  resendText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  resendTimer: { fontFamily: fonts.semiBold, color: colors.text },
  resendLink: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle, opacity: 0.7, marginTop: 4 },
  resendLinkActive: { color: colors.primary, opacity: 1 },
  confirm: { alignSelf: 'stretch', height: 48, marginTop: 20 },
  disabled: { opacity: 0.5 },
  secure: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    marginTop: 20,
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
  },
  secureIcon: { marginTop: 2 },
  secureTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20, color: colors.text },
  secureBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  keypad: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineSoft,
    paddingTop: 8,
    paddingBottom: 8,
  },
  keyGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  key: { width: '33.333%', height: 52, alignItems: 'center', justifyContent: 'center' },
  keyDigit: { fontFamily: fonts.medium, fontSize: 24, lineHeight: 28, color: colors.text },
  keyLetters: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1, color: colors.textSubtle, height: 11 },
  help: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: 8,
  },
  helpLink: { fontFamily: fonts.semiBold, color: colors.primary, textDecorationLine: 'underline' },
}));
