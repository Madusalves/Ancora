import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PasswordInput } from '@/components/PasswordInput';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius } from '@/theme';

import { emailRegistered, isValidEmail, sendEmailCode, signInWithGoogle, signInWithPassword } from './actions';

type Mode = 'login' | 'register';

/** Login (Figma 26:321) e Registro (Figma 43:622): mesma tela, textos diferentes. */
export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = t.auth[mode];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = mode === 'login';

  // Cadastro (e "esqueci a senha"): envia o código e abre a verificação.
  const sendCode = async (reset: boolean) => {
    if (busy) return;
    if (!isValidEmail(email)) {
      setError(t.auth.errors.invalidEmail);
      return;
    }
    setBusy(true);
    setError('');
    if (mode === 'register' && (await emailRegistered(email))) {
      setBusy(false);
      setError(t.auth.errors.alreadyRegistered);
      return;
    }
    const result = await sendEmailCode(email, mode === 'register');
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push({
      pathname: '/verify',
      params: { email: email.trim().toLowerCase(), mode, ...(reset ? { reset: '1' } : {}) },
    });
  };
  const submitEmail = () => sendCode(false);
  const forgotPassword = () => sendCode(true);

  // Login do dia a dia: e-mail + senha, sem código.
  const submitPassword = async () => {
    if (busy) return;
    if (!isValidEmail(email)) return setError(t.auth.errors.invalidEmail);
    if (!password) return setError(t.auth.errors.emptyPassword);
    setBusy(true);
    setError('');
    const result = await signInWithPassword(email, password);
    setBusy(false);
    if (result.ok) router.replace('/home');
    else setError(result.message);
  };

  const submitGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const result = await signInWithGoogle();
    setBusy(false);
    if (result.ok) router.replace('/home');
    else if (result.message) setError(result.message);
  };

  const switchMode = () => router.replace(mode === 'login' ? '/register' : '/login');

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.brand}>{t.brand}</Text>

            <View style={styles.headings}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={submitGoogle}
                disabled={busy}
                style={({ pressed }) => [styles.field, styles.googleButton, pressed && styles.pressed]}>
                <Image
                  source={require('../../../assets/icons/google.svg')}
                  style={styles.googleIcon}
                  contentFit="contain"
                />
                <Text style={styles.googleLabel}>{t.auth.google}</Text>
              </Pressable>

              <Text style={styles.or}>{t.auth.or}</Text>

              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (error) setError('');
                }}
                placeholder={t.auth.emailPlaceholder}
                placeholderTextColor={colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                textContentType="emailAddress"
                returnKeyType={isLogin ? 'next' : 'send'}
                onSubmitEditing={isLogin ? undefined : submitEmail}
                editable={!busy}
                style={[styles.field, styles.input]}
              />

              {isLogin ? (
                <>
                  <PasswordInput
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (error) setError('');
                    }}
                    placeholder={t.auth.passwordPlaceholder}
                    autoComplete="current-password"
                    returnKeyType="go"
                    onSubmitEditing={submitPassword}
                    editable={!busy}
                  />
                  <Button
                    label={t.auth.signIn}
                    onPress={submitPassword}
                    style={[styles.continue, busy && styles.pressed]}
                  />
                  <Pressable accessibilityRole="link" onPress={forgotPassword} hitSlop={8}>
                    <Text style={styles.switchAction}>{t.auth.forgot}</Text>
                  </Pressable>
                </>
              ) : isValidEmail(email) ? (
                <Button
                  label={t.auth.continue}
                  onPress={submitEmail}
                  style={[styles.continue, busy && styles.pressed]}
                />
              ) : null}

              {error ? (
                <Text accessibilityLiveRegion="polite" style={styles.error}>
                  {error}
                </Text>
              ) : null}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchPrompt}>{copy.switchPrompt}</Text>
              <Pressable accessibilityRole="link" onPress={switchMode} hitSlop={8}>
                <Text style={styles.switchAction}>{copy.switchAction}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  card: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.md,
    boxShadow: '0px 10px 15px -3px rgba(15,23,42,0.08)',
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: colors.primary,
    marginBottom: 48,
  },
  headings: { alignItems: 'center', gap: 8, marginBottom: 32 },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: { width: '100%', alignItems: 'center', gap: 16, marginBottom: 24 },
  field: {
    width: '100%',
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.sm,
  },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  googleIcon: { width: 20, height: 20 },
  googleLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.text,
  },
  or: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.textSubtle,
    marginVertical: -8,
  },
  input: {
    paddingHorizontal: 16,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.text,
    textAlign: 'center',
    boxShadow: '0px 1px 1px rgba(0,0,0,0.05)',
  },
  continue: { width: '100%' },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchPrompt: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  switchAction: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.primary,
  },
});
