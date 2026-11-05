import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { type HostInstance, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n/pt-BR';
import { colors, fonts, radius } from '@/theme';

import { markTourSeen } from './storage';

export type TourStep = { id: string; title: string; body: string };

type Rect = { x: number; y: number; width: number; height: number };

type TourContextValue = {
  register: (id: string, ref: RefObject<HostInstance | null>) => () => void;
  start: (steps: TourStep[]) => void;
  active: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

const PAD = 6; // folga do destaque ao redor do elemento
const GAP = 12; // distância entre destaque e balão
const MARGIN = 16;

/** Guia inicial: escurece a tela, destaca um elemento por vez e explica o que ele faz. */
export function TourProvider({ children }: { children: ReactNode }) {
  const targets = useRef(new Map<string, RefObject<HostInstance | null>>());
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [measured, setMeasured] = useState<{ id: string; rect: Rect } | null>(null);
  const active = steps.length > 0;

  const register = useCallback((id: string, ref: RefObject<HostInstance | null>) => {
    targets.current.set(id, ref);
    return () => {
      if (targets.current.get(id) === ref) targets.current.delete(id);
    };
  }, []);

  const start = useCallback((list: TourStep[]) => {
    setIndex(0);
    setSteps(list);
  }, []);

  const close = useCallback(() => {
    setSteps([]);
    setMeasured(null);
    markTourSeen();
  }, []);

  const step = steps[index];
  const rect = measured && step && measured.id === step.id ? measured.rect : null;

  // Mede o alvo do passo atual; se não existir (ainda), o balão fica centralizado.
  useEffect(() => {
    if (!step) return;
    const view = targets.current.get(step.id)?.current;
    if (!view) return;
    const timer = setTimeout(() => {
      view.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) setMeasured({ id: step.id, rect: { x, y, width, height } });
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [step]);

  const value = useMemo(() => ({ register, start, active }), [register, start, active]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && step ? (
        <TourOverlay
          step={step}
          index={index}
          total={steps.length}
          rect={rect}
          onNext={() => (index + 1 >= steps.length ? close() : setIndex(index + 1))}
          onBack={() => setIndex(Math.max(0, index - 1))}
          onSkip={close}
        />
      ) : null}
    </TourContext.Provider>
  );
}

function TourOverlay({
  step,
  index,
  total,
  rect,
  onNext,
  onBack,
  onSkip,
}: {
  step: TourStep;
  index: number;
  total: number;
  rect: Rect | null;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  // A camada fica na mesma janela dos alvos; medimos a origem dela para alinhar o destaque.
  const rootRef = useRef<HostInstance | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0, ox: 0, oy: 0 });
  const measureRoot = () =>
    rootRef.current?.measureInWindow((ox, oy, w, h) => setBox({ ox, oy, w, h }));
  const { w: W, h: H } = box;
  const [tipH, setTipH] = useState(160);
  const last = index === total - 1;

  // Destaque limitado à área visível da janela.
  const hole =
    rect && W > 0
      ? {
          left: Math.max(0, rect.x - box.ox - PAD),
          top: Math.max(0, rect.y - box.oy - PAD),
          right: Math.min(W, rect.x - box.ox + rect.width + PAD),
          bottom: Math.min(H, rect.y - box.oy + rect.height + PAD),
        }
      : null;

  let tipTop: number;
  if (hole) {
    const below = hole.bottom + GAP;
    const above = hole.top - GAP - tipH;
    if (below + tipH <= H - insets.bottom - MARGIN) tipTop = below;
    else if (above >= insets.top + MARGIN) tipTop = above;
    else tipTop = H - insets.bottom - MARGIN - tipH; // alvo muito alto: balão por cima, no rodapé
  } else {
    tipTop = (H - tipH) / 2;
  }

  return (
    <>
      <View ref={rootRef} collapsable={false} onLayout={measureRoot} style={[StyleSheet.absoluteFill, styles.root]}>
        {hole ? (
          <>
            {/* Quatro faixas escuras em volta do destaque (deixa o alvo "vazado") */}
            <View style={[styles.dim, { left: 0, right: 0, top: 0, height: hole.top }]} />
            <View style={[styles.dim, { left: 0, right: 0, top: hole.bottom, bottom: 0 }]} />
            <View style={[styles.dim, { left: 0, width: hole.left, top: hole.top, height: hole.bottom - hole.top }]} />
            <View style={[styles.dim, { left: hole.right, right: 0, top: hole.top, height: hole.bottom - hole.top }]} />
            <View
              style={[
                styles.ring,
                { left: hole.left, top: hole.top, width: hole.right - hole.left, height: hole.bottom - hole.top },
              ]}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
        )}

        <View
          onLayout={(e) => setTipH(e.nativeEvent.layout.height)}
          style={[styles.tip, { top: tipTop, left: MARGIN, right: MARGIN }]}>
          <View style={styles.tipHeader}>
            <Text style={styles.step}>{t.tour.stepOf(index + 1, total)}</Text>
            {!last ? (
              <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={10}>
                <Text style={styles.skip}>{t.tour.skip}</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
          <View style={styles.footer}>
            <View style={styles.dots}>
              {Array.from({ length: total }, (_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
              ))}
            </View>
            <View style={styles.buttons}>
              {index > 0 ? (
                <Pressable accessibilityRole="button" onPress={onBack} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>{t.tour.back}</Text>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={onNext} style={styles.btn}>
                <Text style={styles.btnText}>{last ? t.tour.done : t.tour.next}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const DIM = 'rgba(15,23,42,0.72)';

const styles = StyleSheet.create({
  root: { zIndex: 9999, elevation: 9999 },
  dim: { position: 'absolute', backgroundColor: DIM },
  ring: {
    position: 'absolute',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  tip: {
    position: 'absolute',
    padding: 16,
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md + 4,
    boxShadow: '0px 8px 24px rgba(15,23,42,0.25)',
  },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.6, color: colors.primary, textTransform: 'uppercase' },
  skip: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSubtle },
  title: { fontFamily: fonts.displayBold, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dots: { flexDirection: 'row', gap: 5, flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceHighest },
  dotOn: { width: 16, backgroundColor: colors.primary },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 16, height: 38, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.onPrimary },
  btnGhost: { paddingHorizontal: 12, height: 38, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textMuted },
});

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour precisa estar dentro de <TourProvider>');
  return ctx;
}

/** Marca um elemento como alvo de um passo do tour. Use: <View ref={ref} collapsable={false}>. */
export function useTourTarget(id?: string) {
  const ctx = useContext(TourContext);
  const ref = useRef<HostInstance | null>(null);
  const register = ctx?.register;
  useEffect(() => (id && register ? register(id, ref) : undefined), [id, register]);
  return ref;
}
