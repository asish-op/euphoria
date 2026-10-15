'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import SplitFlapText from './SplitFlapText';
import { useMedia } from './useMedia';

const PrismaticBurst = dynamic(() => import('./PrismaticBurst'), { ssr: false });

// The board flips through these and lands on the name.
const WORDS = ['LOADING', 'GLITTER', 'DISCO', 'EUPHORIA'];
const MIN_MS = 3200; // always stays at least this long, so the name gets a moment on screen
const MAX_MS = 3900; // ...and never longer than this, even on a slow connection

// Full-screen intro. When it lifts it sets html[data-ready] and fires `euphoria:ready`, which is what
// the hero's entrance animations wait for.
export default function Preloader() {
  const rootRef = useRef(null);
  const [gone, setGone] = useState(false);
  const small = useMedia('(max-width: 639px)');

  useEffect(() => {
    const html = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    html.classList.add('is-loading');

    let finished = false;
    const timers = [];

    const release = () => {
      html.classList.remove('is-loading');
      html.dataset.ready = 'true';
      window.dispatchEvent(new Event('euphoria:ready'));
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      const root = rootRef.current;
      if (!root) {
        release();
        setGone(true);
        return;
      }
      const content = root.querySelector('[data-pre-content]');
      // Centre the iris on what the visitor actually sees (the visual viewport), in pixels, so it always
      // closes on the middle of the screen even if a phone's layout viewport differs from it.
      const box = root.getBoundingClientRect();
      const vv = window.visualViewport;
      const cx = (vv ? vv.offsetLeft + vv.width / 2 : window.innerWidth / 2) - box.left;
      const cy = (vv ? vv.offsetTop + vv.height / 2 : window.innerHeight / 2) - box.top;
      const radius = Math.hypot(box.width, box.height);
      gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(content, { scale: 1.12, autoAlpha: 0, duration: 0.45, ease: 'power2.in' })
        .fromTo(
          root,
          { clipPath: `circle(${radius}px at ${cx}px ${cy}px)` },
          { clipPath: `circle(0px at ${cx}px ${cy}px)`, duration: 0.95, ease: 'expo.inOut' },
          '-=0.15'
        )
        .add(release, '-=0.75'); // the hero starts animating while the iris is still closing
    };

    const pageReady = new Promise(resolve => {
      const settle = () => Promise.resolve(document.fonts?.ready).then(resolve, resolve);
      if (document.readyState === 'complete') settle();
      else window.addEventListener('load', settle, { once: true });
    });
    const minElapsed = new Promise(resolve => timers.push(window.setTimeout(resolve, reduced ? 1200 : MIN_MS)));

    Promise.all([pageReady, minElapsed]).then(finish);
    timers.push(window.setTimeout(finish, reduced ? 2400 : MAX_MS));

    return () => {
      timers.forEach(window.clearTimeout);
      html.classList.remove('is-loading');
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Loading Euphoria"
      className="preloader fixed inset-0 z-[100] overflow-hidden bg-ink"
      style={{ clipPath: 'circle(150% at 50% 50%)' }}
    >
      <noscript>
        <style>{'.preloader{display:none!important}'}</style>
      </noscript>

      <div className="absolute inset-0">
        <PrismaticBurst
          intensity={2}
          speed={0.45}
          animationType="rotate3d"
          colors={['#7c4dff', '#e879f9', '#c4b5fd', '#f0abfc']}
          distort={1.4}
          rayCount={0}
          mixBlendMode="lighten"
          maxDpr={small ? 1 : 1.25}
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_50%,rgba(11,6,22,0.55),transparent_75%)]" />

      <div data-pre-content className="relative flex h-full flex-col items-center justify-center gap-7 px-4">
        <SplitFlapText
          words={WORDS}
          loop={false}
          padTo={8}
          cycleDelay={400}
          flipDuration={0.055}
          stagger={0.03}
          flipsPerChar={3}
          tileColor="#1a0b33"
          textColor="#f5d0fe"
          tileRadius={small ? 7 : 10}
          gap={small ? 5 : 8}
          fontSize={small ? 36 : 68}
        />
        <p className="eyebrow">Party · Hyderabad</p>
      </div>
    </div>
  );
}
