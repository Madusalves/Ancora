import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PasswordInput } from '@/components/PasswordInput';
import { MIN_PASSWORD, setAccountPassword } from '@/features/auth/actions';
import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius, createStyles } from '@/theme';

/**
 * Definir senha (após o código por e-mail). Não existe no Figma: usa o mesmo cartão
 * e campos das telas de login para manter a identidade visual.
 */
export default function SetPassword() {
  const router = useRouter();
  const copy = t.setPassword;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    if (password.length < MIN_PASSWORD) return setError(copy.errors.short);
    if (password !== confirm) return setError(copy.errors.mismatch);
    setBusy(true);
    setError('');
    const result = await setAccountPassword(password);
    setBusy(false);
    if (result.ok) router.replace('/home');
    else setError(result.message);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.brand}>{t.brand}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            <View style={styles.fields}>
              <PasswordInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError('');
                }}
                placeholder={copy.password}
                autoComplete="new-password"
                returnKeyType="next"
                editable={!busy}
              />
              <PasswordInput
                value={confirm}
                onChangeText={(v) => {
                  setConfirm(v);
                  setError('');
                }}
                placeholder={copy.confirm}
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={save}
                editable={!busy}
              />
              <Text style={styles.hint}>{copy.hint}</Text>
              {error ? (
                <Text accessibilityLiveRegion="polite" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <Button label={copy.save} onPress={save} style={[styles.button, busy && styles.busy]} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createStyles(() => ({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  card: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: colors.glass,
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
    marginBottom: 32,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  fields: { width: '100%', alignItems: 'center', gap: 16 },
  hint: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, color: colors.textSubtle },
  error: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.error, textAlign: 'center' },
  button: { width: '100%' },
  busy: { opacity: 0.7 },
}));
