import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Glow } from '@/components/Glow';
import { hasSeenOnboarding } from '@/features/onboarding/storage';
import { t } from '@/i18n/pt-BR';
import { supabase } from '@/lib/supabase';
import { colors, createStyles, fonts, getScheme } from '@/theme';

const DARK_LOGO = require('../../assets/images/ancora-logo-dark.png');
const LIGHT_LOGO = require('../../assets/images/ancora-logo-light.png');
const SPLASH_MS = 1800;

/** Splash (Figma 25:4). Depois decide entre o wizard e o login. */
export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const seen = await hasSeenOnboarding();
      if (!active) return;
      if (data.session) router.replace('/home');
      else router.replace(seen ? '/login' : '/onboarding');
    }, SPLASH_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.screen}>
      <Glow size={468} color={colors.primary} opacity={0.18} style={styles.glow} />

      <View style={styles.center}>
        <Image
          source={getScheme() === 'dark' ? DARK_LOGO : LIGHT_LOGO}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel={t.brand}
        />
      </View>

      <Text style={styles.tagline}>{t.splash.tagline}</Text>
    </View>
  );
}

const styles = createStyles(() => ({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  center: { alignItems: 'center' },
  logo: { width: 220, height: 292 },
  tagline: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    color: colors.textSecondary,
  },
}));
