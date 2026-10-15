'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useEvent } from './EventProvider';
import { Reveal } from './anim';
import { EVENT } from '@/lib/event';
import { formatDate } from '@/lib/booking';

const safeUrl = value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
};
export function EventHeroFacts() {
  const { settings } = useEvent();
  return <dl className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-white/10 pt-6"><div><dt className="eyebrow mb-1.5 !text-[0.64rem]">When</dt><dd className="text-base font-semibold text-ice">{settings?.eventDate ? formatDate(settings.eventDate) : EVENT.date || 'Announcing soon'}</dd></div><div><dt className="eyebrow mb-1.5 !text-[0.64rem]">Where</dt><dd className="text-base font-semibold text-ice">{settings?.venueName || EVENT.venue || `${EVENT.city} · venue soon`}</dd></div></dl>;
}
export function EventDetailCards() {
  const { settings } = useEvent();
  const [now, setNow] = useState(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const difference = settings?.eventDate && now ? Math.max(0, new Date(settings.eventDate).getTime() - now) : 0;
  const rows = [
    { k: 'When', v: settings?.eventDate ? formatDate(settings.eventDate) : EVENT.date || 'Announcing soon' },
    { k: 'Where', v: settings?.venueName || EVENT.venue || `${EVENT.city}, venue soon` },
    { k: settings?.entryTime ? 'Entry' : 'Who', v: settings?.entryTime || `${EVENT.audience} only` },
    { k: 'Wear', v: 'Shimmer. Purples, silvers, sequins.' },
  ];
  return <>
    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{rows.map((row, index) => <Reveal key={row.k} variant="flip" delay={index * 90}><div className="glass h-full rounded-3xl p-7"><p className="eyebrow mb-10 !text-orchid">{row.k}</p><p className="font-display text-3xl italic leading-tight text-ice">{row.v}</p>{row.k === 'Where' && settings?.venueAddress && <p className="mt-3 text-sm text-ice/60">{settings.venueAddress}</p>}</div></Reveal>)}</div>
    {settings?.eventStatus && settings.eventStatus !== 'upcoming' && <p className="book-notice mt-6">Event status: {settings.eventStatus}</p>}
    {settings?.showEventCountdown && difference > 0 && <p className="eyebrow mt-8">{Math.floor(difference / 86400000)} days · {Math.floor(difference / 3600000) % 24} hours until the night</p>}
    {settings?.showStatistics && settings.venueCapacity != null && <p className="mt-6 text-ice/60">Venue capacity: {settings.venueCapacity}</p>}
    {settings?.showVenueMap && safeUrl(settings.venueMapEmbed) && <iframe className="book-venue-map mt-8" title="Euphoria event venue" src={safeUrl(settings.venueMapEmbed)} loading="lazy" referrerPolicy="no-referrer" allowFullScreen />}
  </>;
}
export function HomeTicketCTA() {
  const { settings } = useEvent();
  const closed = ['ended', 'cancelled'].includes(settings?.eventStatus);
  return <Reveal variant="scale" delay={450}><div className="relative mt-10 flex flex-wrap justify-center gap-4"><Link href="/passes" className="btn btn-primary text-lg">{closed ? 'View passes' : 'Get tickets'} <span aria-hidden="true">→</span></Link><Link href="/tickets" className="btn btn-ghost text-lg">My passes</Link></div></Reveal>;
}
