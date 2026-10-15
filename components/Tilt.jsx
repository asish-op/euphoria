'use client';

import { useRef } from 'react';

// Pointer-driven 3D tilt with a moving specular glare. Pure CSS transforms, no WebGL.
export default function Tilt({ children, className = '', max = 9, glare = true, lift = 12 }) {
  const ref = useRef(null);
  const frame = useRef(0);

  const update = (x, y) => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
      el.style.setProperty('--gx', `${x * 100}%`);
      el.style.setProperty('--gy', `${y * 100}%`);
      el.style.setProperty('--lift', `${lift}px`);
      el.style.setProperty('--glare', '1');
    });
  };

  const onMove = e => {
    if (e.pointerType === 'touch') return;
    const rect = ref.current.getBoundingClientRect();
    update((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--lift', '0px');
    el.style.setProperty('--glare', '0');
  };

  return (
    <div className="[perspective:1200px]">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`relative [transform-style:preserve-3d] transition-transform duration-200 ease-out will-change-transform ${className}`}
        style={{
          transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(var(--lift, 0px))'
        }}
      >
        {children}
        {glare ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light transition-opacity duration-300"
            style={{
              opacity: 'var(--glare, 0)',
              background:
                'radial-gradient(420px circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.55), transparent 55%)'
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
