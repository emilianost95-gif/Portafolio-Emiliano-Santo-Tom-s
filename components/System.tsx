'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { detectCapabilities } from '@/lib/capabilities';
import { initialQuality, maxQuality, type QualityLevel, readOverride } from '@/lib/quality';
import { selectOverlayOpen, selectSceneState, useSystem } from '@/lib/store';
import { useGlobalInput } from '@/hooks/useGlobalInput';
import { useReveal } from '@/hooks/useReveal';
import { useScrollWorld } from '@/hooks/useScrollWorld';
import { Cursor } from './Cursor';
import { Hud } from './Hud';
import { IndexOverlay } from './IndexOverlay';
import { Intro } from './Intro';
import { ProjectViewer } from './ProjectViewer';
import { Telemetry } from './Telemetry';
import { Terminal } from './Terminal';

// Three.js y la escena viajan en un chunk aparte: en modo estático no se descargan.
const Scene = dynamic(() => import('@/3d/Scene'), { ssr: false });

interface Boot {
  readonly max: QualityLevel;
  readonly fixed: boolean;
}

/**
 * Arranque y capas globales. Orden: el contenido ya está en el HTML → se mide el
 * dispositivo → solo si corresponde se descarga la capa gráfica.
 */
export function System() {
  const [boot, setBoot] = useState<Boot | null>(null);
  const quality = useSystem((state) => state.quality);
  const coarse = useSystem((state) => state.coarsePointer);
  const sceneState = useSystem(selectSceneState);
  const forge = useSystem((state) => state.forge);
  const introDone = useSystem((state) => state.introDone);
  const overlayOpen = useSystem(selectOverlayOpen);

  useEffect(() => {
    const caps = detectCapabilities();
    const override = readOverride(location.search);
    useSystem.getState().set({
      quality: initialQuality(caps, override),
      reducedMotion: caps.reducedMotion,
      coarsePointer: caps.coarsePointer,
    });
    setBoot({ max: maxQuality(caps), fixed: override !== null });

    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => useSystem.getState().set({ reducedMotion: media.matches });
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // El estado de la escena se refleja en <html>: el CSS reacciona sin re-renderizar nada.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.state = sceneState;
    root.dataset.gfx = quality ?? 'pending';
    root.toggleAttribute('data-forge', forge);
    root.toggleAttribute('data-locked', overlayOpen);
    root.toggleAttribute('data-ready', introDone);
  }, [sceneState, quality, forge, overlayOpen, introDone]);

  // Con un diálogo abierto, el resto de la página queda inerte: el foco no puede escaparse.
  useEffect(() => {
    document.querySelectorAll('main, [data-hud]').forEach((element) => element.toggleAttribute('inert', overlayOpen));
  }, [overlayOpen]);

  useGlobalInput();
  useScrollWorld();
  useReveal();

  return (
    <>
      {boot && quality && quality !== 'static' && <Scene max={boot.max} fixed={boot.fixed} />}
      <Intro />
      <Hud />
      <ProjectViewer />
      <IndexOverlay />
      <Terminal />
      <Telemetry />
      {!coarse && <Cursor />}
    </>
  );
}
