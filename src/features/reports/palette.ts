import { colors, getScheme, type Scheme } from '@/theme';

/** Cores dos gráficos. Dependem do tema, então são funções (leem o esquema na hora de usar). */
const SLICES: Record<Scheme, string[]> = {
  dark: ['#e0c050', '#5b9bd5', '#b28fe0', '#8a857a'],
  light: ['#c19a1e', '#3b7dc4', '#8a63c4', '#8a857a'],
};

export const sliceColors = (): string[] => SLICES[getScheme()];
export const flowIncome = (): string => colors.income;
export const flowExpense = (): string => colors.expense;

/** O PDF é sempre claro (vai para impressão), independente do tema do app. */
export const PDF = {
  slices: SLICES.light,
  income: '#1f8a4c',
  expense: '#c0443d',
  brand: '#8f6b00',
};
