'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Headline, Reveal } from './anim';

const PixelSculpt = dynamic(() => import('./PixelSculpt'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[url('/images/disco-ball.jpg')] bg-cover bg-center opacity-40" />
});

const TRACK = {
  src: '/audio/stringed-disco.mp3',
  title: 'Stringed Disco',
  artist: 'Kevin MacLeod',
  artistUrl: 'https://incompetech.com',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/'
};

const TARGET_VOLUME = 0.85;

// A free disco track plays while this section is on screen (once the visitor opts in — browsers block
// autoplay with sound) and fades out when they scroll away. The same audio feeds PixelSculpt's analyser.
export default function SculptSection() {
  const sectionRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const contextRef = useRef(null);
  const fadeRef = useRef(0);

  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const shouldPlay = enabled && inView && tabVisible;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35
    });
    observer.observe(el);
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Fade in / out instead of hard start-stop.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !contextRef.current) return undefined;
    cancelAnimationFrame(fadeRef.current);

    const step = () => {
      const target = shouldPlay ? TARGET_VOLUME : 0;
      const next = audio.volume + (target - audio.volume) * 0.08;
      audio.volume = Math.abs(target - next) < 0.01 ? target : next;
      if (audio.volume !== target) {
        fadeRef.current = requestAnimationFrame(step);
      } else if (!shouldPlay) {
        audio.pause();
      }
    };

    if (shouldPlay) {
      contextRef.current.resume?.();
      audio.play().catch(() => setEnabled(false)); // e.g. blocked by the browser
    }
    fadeRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(fadeRef.current);
  }, [shouldPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    const context = contextRef.current;
    return () => {
      cancelAnimationFrame(fadeRef.current);
      audio?.pause();
      context?.close?.();
    };
  }, []);

  const toggle = useCallback(() => {
    // Everything audio-related is created inside this click: that is the user gesture browsers require.
    if (!contextRef.current && audioRef.current) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContextClass();
        const source = context.createMediaElementSource(audioRef.current);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.78;
        source.connect(analyser);
        analyser.connect(context.destination);
        audioRef.current.volume = 0;
        contextRef.current = context;
        analyserRef.current = analyser;
      } catch {
        return; // No Web Audio: leave the sculpt in its silent mode.
      }
    }
    setEnabled(value => !value);
  }, []);

  const playing = shouldPlay;

  return (
    // Phones: a normal stacked flow (text, sculpt, button). md and up: the sculpt is full-bleed and the text
    // and button float over it — there is never a card around the sculpt.
    <div ref={sectionRef} className="relative md:h-[115svh] md:min-h-[700px]">
      <audio ref={audioRef} src={TRACK.src} loop preload="none" playsInline />

      <div className="pointer-events-none relative z-10 md:absolute md:inset-x-0 md:top-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pt-24 sm:px-8 md:flex-row md:items-end md:justify-between md:gap-6 md:pt-32">
          <div>
            <Reveal>
              <p className="eyebrow mb-4 md:mb-5">Inside the ball</p>
            </Reveal>
            <Headline text="A thousand *tiny mirrors.*" className="text-[2.75rem] sm:text-6xl lg:text-7xl" />
          </div>
          <Reveal delay={200}>
            <p className="max-w-sm text-[0.95rem] text-ice/75 md:text-base">
              The mirror ball, rebuilt from tiles. Turn the music on and it dances. Move across it, tap to send a
              shockwave.
            </p>
          </Reveal>
        </div>
      </div>

      {/* The sculpt itself: no frame. It dissolves into the page at its edges. */}
      <div className="relative -mt-6 h-[54svh] min-h-[360px] [-webkit-mask-image:radial-gradient(ellipse_80%_72%_at_50%_52%,#000_48%,transparent_100%)] [mask-image:radial-gradient(ellipse_80%_72%_at_50%_52%,#000_48%,transparent_100%)] md:absolute md:inset-0 md:mt-0 md:h-auto md:min-h-0 md:[-webkit-mask-image:radial-gradient(ellipse_78%_70%_at_50%_52%,#000_48%,transparent_100%)] md:[mask-image:radial-gradient(ellipse_78%_70%_at_50%_52%,#000_48%,transparent_100%)]">
        <Reveal variant="scale" className="h-full w-full">
          <PixelSculpt
            src="/images/disco-ball.jpg"
            columns={120}
            depth={2.8}
            fit={1.32}
            analyserRef={analyserRef}
            className="absolute inset-0"
          />
        </Reveal>
      </div>

      <div className="relative z-10 md:absolute md:inset-x-0 md:bottom-0">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 pb-14 pt-1 text-center sm:px-8 md:items-start md:pb-10 md:text-left">
          <Reveal variant="scale" delay={150}>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={enabled}
              className="btn btn-primary text-base"
            >
              <span aria-hidden="true" className={`eq ${playing ? 'eq-on' : ''}`}>
                <i />
                <i />
                <i />
                <i />
              </span>
              {enabled ? 'Sound on' : 'Play the night'}
            </button>
          </Reveal>
          <p className="text-xs text-ice/45">
            Music: “{TRACK.title}” by{' '}
            <a href={TRACK.artistUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ice/80">
              {TRACK.artist}
            </a>{' '}
            (incompetech.com), licensed{' '}
            <a href={TRACK.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ice/80">
              CC BY 4.0
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
