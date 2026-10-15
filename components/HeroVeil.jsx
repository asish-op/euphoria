'use client';

import dynamic from 'next/dynamic';
import Tilt from './Tilt';
import { useMedia } from './useMedia';

const DitherVeil = dynamic(() => import('./DitherVeil'), {
  ssr: false,
  // Static poster while the WebGL veil boots (and for anyone without WebGL2).
  loading: () => <div className="h-full w-full bg-[url('/images/stage.jpg')] bg-cover bg-center opacity-60" />
});

export default function HeroVeil() {
  // On a phone the card is ~340px wide; a 170px reveal would uncover half of it.
  const small = useMedia('(max-width: 639px)');
  return (
    <Tilt max={7} lift={18} className="rounded-[2rem]">
      <div className="glass relative overflow-hidden rounded-[2rem] p-2.5 sm:p-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] sm:aspect-[5/6] lg:aspect-[4/5]">
          <DitherVeil
            src="/images/stage.jpg"
            fit="cover"
            pattern="atkinson"
            pixelSize={3}
            levels={2}
            inkColor="#0d0620"
            paperColor="#d8b4fe"
            contrast={1.25}
            brightness={0.02}
            revealRadius={small ? 58 : 170}
            softness={small ? 0.55 : 0.7}
            linger={1.4}
            rimColor="#e879f9"
            rim={0.08}
            wander
            clickBurst
          />
        </div>

        {/* Floating chips sit on their own Z layers, so they parallax against the frame. */}
        <div className="pointer-events-none absolute left-5 top-5 [transform:translateZ(60px)] sm:left-7 sm:top-7">
          <span className="glass eyebrow inline-flex items-center gap-2 rounded-full px-3.5 py-2 !text-[0.66rem] text-ice">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-orchid shadow-[0_0_10px_2px_#e879f9]" />
            Hyderabad
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-5 right-5 [transform:translateZ(80px)] sm:bottom-7 sm:right-7">
          <span className="glass eyebrow rounded-full px-3.5 py-2 !text-[0.66rem] text-ice">Touch the light</span>
        </div>
      </div>
    </Tilt>
  );
}
