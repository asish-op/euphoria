'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// WebGPU + vgpu are only needed in the browser, so keep them out of the server render and initial bundle.
const AeroShards = dynamic(() => import('./AeroShards'), { ssr: false });

const DEFAULT_LAYOUT = { placement: 'right', flow: 'stream' };
const SETTLE_DELAY = 130; // ignore scenes the viewport only flicks past while scrolling

const subscribe = () => () => {};
const supportsWebGpu = () => 'gpu' in navigator;
const serverSnapshot = () => null; // unknown on the server: render the fallback, upgrade after hydration

// The shards are the page's opening and closing act. Sections declare data-scene="right|left|center|full"
// to show them, or data-scene="off" to hide them (the sections in between have their own backgrounds).
//
// Transitions never happen in plain view:
//  - while hidden, the layer is paused, and the paused renderer snaps to whichever visible section is nearest,
//    so the stream is already in the right shape when it fades back in;
//  - if the layout still has to change while visible (e.g. a very fast scroll), the layer dims while it reshapes.
export default function Backdrop() {
  const pathname = usePathname();
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [hidden, setHidden] = useState(false);
  const [dipping, setDipping] = useState(false);
  const [failed, setFailed] = useState(false);
  const layoutRef = useRef(DEFAULT_LAYOUT);
  const hiddenRef = useRef(false);
  const dipTimer = useRef(0);

  const webgpu = useSyncExternalStore(subscribe, supportsWebGpu, serverSnapshot);
  const useShards = webgpu === true && !failed;

  useEffect(() => {
    if (!useShards) return undefined;
    const sections = [...document.querySelectorAll('[data-scene]')];
    if (!sections.length) return undefined;

    const setTarget = (next, dim) => {
      const current = layoutRef.current;
      if (current.placement === next.placement && current.flow === next.flow) return;
      layoutRef.current = next;
      setLayout(next);
      if (!dim) return;
      setDipping(true);
      window.clearTimeout(dipTimer.current);
      dipTimer.current = window.setTimeout(() => setDipping(false), 1100);
    };

    const sceneOf = el => ({ placement: el.dataset.scene, flow: el.dataset.flow || DEFAULT_LAYOUT.flow });

    // While hidden: reshape (invisibly) for whichever shard section the reader is closest to.
    const retarget = () => {
      const mid = window.innerHeight / 2;
      let best = null;
      let bestDistance = Infinity;
      for (const section of sections) {
        if (section.dataset.scene === 'off') continue;
        const rect = section.getBoundingClientRect();
        const distance = rect.top > mid ? rect.top - mid : rect.bottom < mid ? mid - rect.bottom : 0;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = section;
        }
      }
      if (best) setTarget(sceneOf(best), false);
    };

    const apply = el => {
      if (el.dataset.scene === 'off') {
        hiddenRef.current = true;
        setHidden(true);
        retarget();
        return;
      }
      hiddenRef.current = false;
      setHidden(false);
      setTarget(sceneOf(el), true);
    };

    let settle = 0;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          window.clearTimeout(settle);
          settle = window.setTimeout(() => apply(entry.target), SETTLE_DELAY);
        }
      },
      // A thin band across the middle of the viewport: whichever section crosses it owns the scene.
      { rootMargin: '-50% 0px -49% 0px' }
    );
    sections.forEach(section => observer.observe(section));

    let frame = 0;
    const onScroll = () => {
      if (!hiddenRef.current || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        retarget();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.clearTimeout(dipTimer.current);
    };
  }, [useShards, pathname]);

  const opacity = hidden ? 0 : dipping ? 0.3 : 1;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      {/* Always underneath: the gradient shows instantly, and stays if WebGPU is missing or fails. */}
      <div className="aurora absolute inset-0" />
      {useShards ? (
        <div
          className="absolute inset-0 transition-opacity ease-out"
          style={{ opacity, transitionDuration: hidden ? '700ms' : dipping ? '450ms' : '1100ms' }}
        >
          <AeroShards
            backgroundColor="#0B0616"
            shardColor="#7C4DFF"
            accentColor="#E879F9"
            placement={layout.placement}
            flow={layout.flow}
            material="chrome"
            detail="balanced"
            density={1.25}
            shardSize={1.1}
            bloom={0.8}
            grain={0.04}
            speed={0.8}
            transitionDuration={1.6}
            interaction="repel"
            // Fully hidden: stop rendering (and let the layout snap) — nobody can see it.
            paused={hidden}
            onError={() => setFailed(true)}
          />
        </div>
      ) : null}
      {/* Keeps text legible over the brightest shards. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent,rgba(11,6,22,0.55))]" />
    </div>
  );
}
