'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// GSAP text + card animation. Nothing here is scrubbed to the scroll position: elements are hidden, then
// play a timed entrance once when they come into view (or when the preloader lifts, for the hero).

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => window.matchMedia('(max-width: 767px)').matches;

// Phones: start the entrance *before* the element reaches the screen (so a fast flick never shows a blank gap
// that then animates in), and keep the motion smaller and quicker.
const startFor = () => (phone() ? 'top bottom+=160' : 'top 92%');
const soften = (from, k) => {
  const out = { ...from };
  for (const key of ['x', 'y', 'rotation', 'rotationX']) if (typeof out[key] === 'number') out[key] *= k;
  if (typeof out.scale === 'number') out.scale = 1 - (1 - out.scale) * k;
  return out;
};

// Keeps every ScrollTrigger honest: positions are measured again once the preloader lifts, fonts settle and the
// page has loaded (they were first measured while scrolling was locked and layout was still moving).
export function ScrollRefresh() {
  useGSAP(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    let timer = 0;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    window.addEventListener('euphoria:ready', refresh);
    window.addEventListener('load', refresh);
    Promise.resolve(document.fonts?.ready).then(refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('euphoria:ready', refresh);
      window.removeEventListener('load', refresh);
    };
  }, []);
  return null;
}

// Runs cb once the preloader has finished (or right away if it already has / never existed).
function whenReady(cb) {
  const html = document.documentElement;
  if (html.dataset.ready === 'true') {
    cb();
    return () => {};
  }
  let fired = false;
  const go = () => {
    if (fired) return;
    fired = true;
    window.removeEventListener('euphoria:ready', go);
    window.clearTimeout(fallback);
    cb();
  };
  const fallback = window.setTimeout(go, 6500);
  window.addEventListener('euphoria:ready', go);
  return () => {
    fired = true;
    window.removeEventListener('euphoria:ready', go);
    window.clearTimeout(fallback);
  };
}

const HIDDEN = { visibility: 'hidden' }; // shown by GSAP (autoAlpha) so nothing flashes before it animates

const VARIANTS = {
  up: { from: { y: 70 }, ease: 'expo.out', duration: 1.25 },
  left: { from: { x: -110 }, ease: 'expo.out', duration: 1.3 },
  right: { from: { x: 110 }, ease: 'expo.out', duration: 1.3 },
  scale: { from: { scale: 0.8, y: 34 }, ease: 'back.out(1.6)', duration: 1.1 },
  pop: { from: { scale: 0.15, rotation: -30 }, ease: 'back.out(2.4)', duration: 0.9 },
  flip: {
    from: { rotationX: -62, y: 80, transformPerspective: 900, transformOrigin: '50% 100%' },
    ease: 'power4.out',
    duration: 1.4
  }
};

// Entrance for any element or card.
export function Reveal({ children, delay = 0, variant = 'up', as: Tag = 'div', className = '', immediate = false, ...rest }) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced()) {
      gsap.set(el, { autoAlpha: 1 });
      return undefined;
    }
    const base = VARIANTS[variant] ?? VARIANTS.up;
    const small = phone();
    const from = small ? soften(base.from, 0.45) : base.from;
    const { ease } = base;
    const duration = small ? base.duration * 0.72 : base.duration;
    const wait = (small && !immediate ? delay * 0.5 : delay) / 1000;
    const play = () =>
      gsap.to(el, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, rotationX: 0, duration, ease, delay: wait, clearProps: 'transform' });

    gsap.set(el, { autoAlpha: 0, ...from });
    if (immediate) return whenReady(play);
    const trigger = ScrollTrigger.create({ trigger: el, start: startFor(), once: true, onEnter: play });
    return () => trigger.kill();
  }, [variant, delay, immediate]);

  return (
    <Tag ref={ref} className={className} style={HIDDEN} {...rest}>
      {children}
    </Tag>
  );
}

// Headline: each line is masked and its words fly up out of it. `*words*` become the gradient italic.
export function Headline({ text, as: Tag = 'h2', className = '', delay = 0 }) {
  const ref = useRef(null);
  const parts = text.split(/(\*[^*]+\*)/).filter(Boolean);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced()) {
      gsap.set(el, { autoAlpha: 1 });
      return undefined;
    }
    let split;
    let dead = false;
    // Wait for the web fonts: splitting before they load measures the wrong line breaks.
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      split = SplitText.create(el, {
        type: 'lines,words',
        mask: 'lines',
        autoSplit: true, // re-splits (and keeps the animation's progress) if the width changes
        onSplit(self) {
          // The masks clip descenders / italic overhang unless given a little room.
          self.masks.forEach(mask => {
            mask.style.paddingBottom = '0.16em';
            mask.style.marginBottom = '-0.16em';
            mask.style.paddingRight = '0.08em';
          });
          gsap.set(el, { autoAlpha: 1 });
          const small = phone();
          return gsap.from(self.words, {
            yPercent: 125,
            rotation: small ? 4 : 7,
            duration: small ? 0.9 : 1.25,
            ease: 'expo.out',
            stagger: small ? 0.055 : 0.075,
            delay: (small ? delay * 0.5 : delay) / 1000,
            scrollTrigger: { trigger: el, start: startFor(), once: true }
          });
        }
      });
    });
    return () => {
      dead = true;
      split?.revert();
    };
  }, [text, delay]);

  return (
    <Tag ref={ref} className={`headline ${className}`} style={HIDDEN}>
      {parts.map((part, i) =>
        part.startsWith('*') ? (
          <span key={i} className="grad">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        )
      )}
    </Tag>
  );
}

// The wordmark wipes in left-to-right (one clip, so its continuous gradient stays intact).
export function Wordmark({ children, className = '' }) {
  const ref = useRef(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced()) {
      gsap.set(el, { autoAlpha: 1 });
      return undefined;
    }
    gsap.set(el, { autoAlpha: 0 });
    return whenReady(() =>
      gsap.fromTo(
        el,
        { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 0, y: 44, skewX: -8 },
        { clipPath: 'inset(-40% -25% -40% -25%)', autoAlpha: 1, y: 0, skewX: 0, duration: 1.6, ease: 'expo.out' }
      )
    );
  }, []);

  return (
    <h1 ref={ref} className={className} style={HIDDEN}>
      {children}
    </h1>
  );
}

// Vertical timeline: its glowing line draws itself down when the list arrives (a timed tween, not scrubbed).
export function Timeline({ children, className = '' }) {
  const ref = useRef(null);
  const lineRef = useRef(null);

  useGSAP(() => {
    const line = lineRef.current;
    if (!line) return undefined;
    if (reduced()) return undefined;
    gsap.set(line, { scaleY: 0, transformOrigin: 'top' });
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 70%',
      once: true,
      onEnter: () => gsap.to(line, { scaleY: 1, duration: 2.4, ease: 'power2.inOut' })
    });
    return () => trigger.kill();
  }, []);

  const track = 'absolute bottom-6 left-[1.65rem] top-6 w-px sm:left-[2.15rem]';
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div aria-hidden="true" className={`${track} bg-white/10`} />
      <div
        ref={lineRef}
        aria-hidden="true"
        className={`${track} bg-gradient-to-b from-orchid via-lilac to-orchid/40 shadow-[0_0_12px_2px_rgba(232,121,249,0.65)]`}
      />
      {children}
    </div>
  );
}

// Number badge that pops in with a little spin.
export function StepDot({ children, className = '', delay = 0 }) {
  return (
    <Reveal as="span" variant="pop" delay={delay} className={className}>
      {children}
    </Reveal>
  );
}
