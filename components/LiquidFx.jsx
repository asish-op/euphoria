'use client';

import { useEffect } from 'react';

// Supporting pieces for the .btn "liquid glass" look:
//  1. An SVG displacement filter used as a backdrop-filter, so the scene behind a button visibly bends
//     (refraction). Only Chromium renders url() backdrop filters, so we opt in at runtime and every other
//     browser keeps the blur + saturation + specular-edge version, which still reads as glass.
//  2. Pointer tracking that moves each button's specular highlight under the cursor.
export default function LiquidFx() {
  useEffect(() => {
    const root = document.documentElement;
    const chromium = navigator.userAgentData?.brands?.some(b => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand));
    if (chromium && CSS.supports?.('backdrop-filter', 'url(#liquid-glass) blur(2px)')) {
      root.dataset.refract = 'true';
    }

    const onMove = e => {
      const btn = e.target instanceof Element ? e.target.closest('.btn') : null;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      btn.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      delete root.dataset.refract;
    };
  }, []);

  return (
    <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
      <defs>
        <filter id="liquid-glass" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.02" numOctaves="2" seed="4" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2.4" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
