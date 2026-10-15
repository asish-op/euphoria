'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useMedia } from './useMedia';

const Topography = dynamic(() => import('./Topography'), { ssr: false });
const PixelSnow = dynamic(() => import('./PixelSnow'), { ssr: false });

// Soft top/bottom fade so a section's background dissolves into the page instead of ending in an edge.
const FADE =
  '[-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]';

// Mounts its child only while the section is near the viewport, and unmounts it otherwise. Each of these
// backgrounds owns a WebGL context; browsers cap how many can live at once, so we never keep them all.
function LazyBg({ children, className = '' }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let idle = 0;
    const later = window.requestIdleCallback ?? (cb => window.setTimeout(cb, 60));
    const cancelLater = window.cancelIdleCallback ?? window.clearTimeout;
    const observer = new IntersectionObserver(
      ([entry]) => {
        cancelLater(idle);
        if (!entry.isIntersecting) return setNear(false);
        // Creating a WebGL context + compiling shaders blocks the main thread: do it when the browser is idle.
        idle = later(() => setNear(true), { timeout: 400 });
      },
      { rootMargin: '140% 0px' }
    );
    observer.observe(el);
    return () => {
      cancelLater(idle);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 ${FADE} ${className}`}>
      {near ? children : null}
    </div>
  );
}

// The night — drifting contour lines in the page's purples and pinks.
export function TopographyBg() {
  const small = useMedia('(max-width: 639px)');
  return (
    <LazyBg>
      <Topography
        lowColor="#4f2bd6"
        midColor="#e879f9"
        highColor="#ffe6ff"
        speed={0.28}
        morphAmount={2.6}
        bands={small ? 2.4 : 3}
        thickness={0.011}
        glow={0.55}
        contrast={2.6}
        opacity={0.55}
        grain={false}
        mouseInteraction={false}
      />
    </LazyBg>
  );
}

// Run of show — glitter pixels falling through the dark. Screen-blended: far flakes are drawn dark, and screen
// makes dark pixels vanish while the bright ones glow.
export function SnowBg() {
  const small = useMedia('(max-width: 639px)');
  return (
    <LazyBg className="mix-blend-screen">
      <PixelSnow
        color="#e9d5ff"
        variant="square"
        density={0.2}
        speed={0.7}
        flakeSize={0.011}
        minFlakeSize={1.4}
        pixelResolution={small ? 150 : 230}
        depthFade={9}
        brightness={1.1}
        direction={110}
      />
    </LazyBg>
  );
}
