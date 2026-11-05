import { Redirect } from 'expo-router';

/**
 * Destino do redirecionamento do login com Google (`ancora://auth/callback`).
 * O código é lido por `signInWithGoogle` assim que o navegador fecha; esta rota só evita
 * a tela de "rota não encontrada" caso o sistema também abra o link dentro do app.
 */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
