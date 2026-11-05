import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { createElement, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLongDate, toISODate } from '@/features/transactions/format';
import { parseDay } from '@/features/home/stats';
import { colors, fonts, radius } from '@/theme';

type Props = { value: Date; onChange: (d: Date) => void };

/** Campo de data que funciona no Android, iOS e navegador. */
export function DateField({ value, onChange }: Props) {
  const [iosOpen, setIosOpen] = useState(false);

  if (Platform.OS === 'web') {
    return createElement('input', {
      type: 'date',
      value: toISODate(value),
      onChange: (e: { target: { value: string } }) => {
        if (e.target.value) onChange(parseDay(e.target.value));
      },
      style: {
        height: 42,
        padding: '0 13px',
        border: `1px solid ${colors.outlineMedium}`,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        color: colors.text,
        fontFamily: fonts.regular,
        fontSize: 14,
      },
    });
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: (_e, picked) => picked && onChange(picked),
      });
    } else {
      setIosOpen((v) => !v);
    }
  };

  return (
    <View>
      <Pressable accessibilityRole="button" onPress={open} style={styles.field}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.text}>{formatLongDate(value)}</Text>
      </Pressable>
      {iosOpen ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="inline"
          onChange={(_e, picked) => picked && onChange(picked)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineMedium,
    borderRadius: radius.sm,
  },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
});
