import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { t } from '@/i18n/pt-BR';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type AuthResult = { ok: true } | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string) => EMAIL_RE.test(email.trim());

/** Já existe conta com este e-mail? (função `email_registered` no banco) */
export async function emailRegistered(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('email_registered', { p_email: email.trim() });
  return !error && data === true;
}

/** Envia o código de 6 dígitos. No login, não cria conta nova. */
export async function sendEmailCode(email: string, createUser: boolean): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: createUser },
  });
  if (!error) return { ok: true };

  const e = t.auth.errors;
  if (error.code === 'otp_disabled' || /signups not allowed/i.test(error.message)) {
    return { ok: false, message: e.noAccount };
  }
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
    return { ok: false, message: e.rateLimit };
  }
  return { ok: false, message: e.generic };
}

export const MIN_PASSWORD = 8;

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (!error) return { ok: true };
  const e = t.auth.errors;
  if (error.code === 'invalid_credentials') return { ok: false, message: e.invalidCredentials };
  if (error.status === 429) return { ok: false, message: e.rateLimit };
  return { ok: false, message: e.generic };
}

/** Define a senha da conta logada e marca que ela existe (para não pedir de novo). */
export async function setAccountPassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } });
  return error ? { ok: false, message: t.setPassword.errors.generic } : { ok: true };
}

/** Depois do código: precisa definir senha se ainda não tem (ou se pediu "esqueci a senha"). */
export async function needsPassword(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return !data.user?.user_metadata?.has_password;
}

export async function verifyEmailCode(email: string, token: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: 'email',
  });
  return error ? { ok: false, message: t.auth.errors.invalidCode } : { ok: true };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return { ok: false, message: t.auth.errors.google };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { ok: false, message: '' }; // cancelado pelo usuário

  const code = new URL(result.url).searchParams.get('code');
  if (!code) return { ok: false, message: t.auth.errors.google };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return exchangeError ? { ok: false, message: t.auth.errors.google } : { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
