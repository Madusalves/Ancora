import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Largura máxima do conteúdo: em telas grandes (tablet, dobrável) ele centraliza em vez de esticar. */
export const MAX_CONTENT_WIDTH = 560;
const MIN_GUTTER = 16;

/**
 * Medidas responsivas para telas rolável.
 * - `gutter`: margem lateral (16 em celulares; cresce para centralizar em telas largas).
 * - `bottom(base)`: respiro inferior somando a área da barra de navegação do sistema
 *   (botões de 3 teclas ou gestos); em telas dentro das abas a barra de abas já cuida disso.
 */
export function useScreenLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gutter = Math.max(MIN_GUTTER, Math.round((width - MAX_CONTENT_WIDTH) / 2));
  return {
    gutter,
    /** Estilo para `contentContainerStyle`. `inTabs`: a tela fica acima da barra de abas. */
    content: (base: number, inTabs = false) => ({
      paddingHorizontal: gutter,
      paddingBottom: base + (inTabs ? 0 : insets.bottom),
    }),
  };
}
