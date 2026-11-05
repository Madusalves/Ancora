import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n/pt-BR';
import { colors, fonts } from '@/theme';

export function ComingSoon({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.soon}>{t.soon.title}</Text>
        <Text style={styles.body}>{t.soon.body}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.text },
  soon: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.primary },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
