import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'finora:home-tour-seen';

export async function hasSeenTour(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return true; // Sem persistência, melhor não incomodar o usuário a cada abertura.
  }
}

export async function markTourSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    // Sem persistência: o tour pode reaparecer na próxima abertura.
  }
}

export async function resetTour(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignora
  }
}
