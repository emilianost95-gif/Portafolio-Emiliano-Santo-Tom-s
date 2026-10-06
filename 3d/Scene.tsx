'use client';

import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { AdaptiveQuality } from '@/lib/adaptiveQuality';
import { QUALITY_LEVELS, QUALITY_PROFILES, type QualityLevel } from '@/lib/quality';
import { useSystem } from '@/lib/store';
import { world } from '@/lib/world';
import { Core } from './Core';

interface SceneProps {
  /** Techo de calidad del dispositivo. */
  readonly max: QualityLevel;
  /** Calidad fijada con ?gfx=: no se ajusta sola. */
  readonly fixed: boolean;
}

/** Mide frames reales, ajusta la calidad y publica la telemetría. */
function Governor({ max, fixed }: SceneProps) {
  const gl = useThree((state) => state.gl);
  const adaptive = useRef<AdaptiveQuality | null>(null);
  const window_ = useRef({ frames: 0, elapsed: 0 });

  useEffect(() => {
    if (fixed) return;
    adaptive.current = new AdaptiveQuality({
      levels: QUALITY_LEVELS,
      initial: useSystem.getState().quality ?? 'low',
      max,
      onChange: (level) => useSystem.getState().set({ quality: level }),
    });
    return () => {
      adaptive.current = null;
    };
  }, [fixed, max]);

  // Si el navegador nos quita el contexto, el sitio sigue completo en modo estático.
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = () => useSystem.getState().set({ quality: 'static' });
    canvas.addEventListener('webglcontextlost', onLost);
    return () => canvas.removeEventListener('webglcontextlost', onLost);
  }, [gl]);

  useFrame((_, delta) => {
    adaptive.current?.sample(delta * 1000, performance.now());
    const sample = window_.current;
    sample.frames++;
    sample.elapsed += delta;
    if (sample.elapsed >= 0.5) {
      world.stats.fps = Math.round(sample.frames / sample.elapsed);
      world.stats.calls = gl.info.render.calls;
      world.stats.dpr = gl.getPixelRatio();
      sample.frames = 0;
      sample.elapsed = 0;
    }
  });
  return null;
}

export default function Scene({ max, fixed }: SceneProps) {
  const quality = useSystem((state) => state.quality) ?? 'low';
  const profile = QUALITY_PROFILES[quality];

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, profile.maxPixelRatio]}
        camera={{ fov: 35, near: 0.1, far: 40, position: [0, 0, 6] }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false }}
      >
        <Governor max={max} fixed={fixed} />
        <Core />
        {profile.postProcessing && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.35} luminanceSmoothing={0.3} />
            <Noise opacity={0.045} />
            <Vignette offset={0.25} darkness={0.7} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
