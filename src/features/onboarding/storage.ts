import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'finora:onboarding-seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Sem persistência: o wizard apenas reaparece na próxima abertura.
  }
}
