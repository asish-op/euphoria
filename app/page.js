import HeroVeil from "@/components/HeroVeil";
import SculptSection from "@/components/SculptSection";
import Tilt from "@/components/Tilt";
import LiquidFx from "@/components/LiquidFx";
import { TopographyBg, SnowBg } from "@/components/SectionBackgrounds";
import { Headline, Reveal, ScrollRefresh, StepDot, Timeline, Wordmark } from "@/components/anim";
import { EVENT, NAV, HIGHLIGHTS, RUN_OF_SHOW } from "@/lib/event";
import Link from "next/link";
import { EventHeroFacts, EventDetailCards, HomeTicketCTA } from "@/components/EventContent";

const MARQUEE = ["Glitter", "Stars", "Disco", "Euphoria", "Oblivion", "Hyderabad", "Shimmer", "Mirror ball", "One night"];

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav className="nav-frost mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full py-1.5 pl-4 pr-1.5 sm:py-2 sm:pl-6 sm:pr-2">
        <a href="#top" className="font-display text-[1.45rem] italic leading-none tracking-tight text-ice sm:text-[1.7rem]">
          euphoria<span className="text-orchid">✦</span><span className="collab-x hidden sm:inline">×</span><span className="hidden font-display text-ice/80 sm:inline">oblivion</span>
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="eyebrow !tracking-[0.2em] text-ice/70 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <Link href="/passes" className="btn btn-primary whitespace-nowrap !px-4 !py-2.5 text-[0.82rem] sm:!px-5 sm:text-sm">
          Get tickets
        </Link>
      </nav>
    </header>
  );
}

// The shards open the page (here) and close it (the tickets section). Everything in between has its own background.
function Hero() {
  return (
    <section
      id="top"
      data-scene="right"
      data-flow="stream"
      className="relative flex min-h-[100svh] items-center overflow-hidden px-5 pb-16 pt-32 sm:px-8 lg:pt-28"
    >
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <div>
          <Reveal immediate delay={100}>
            <p className="eyebrow mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-lilac/60" />
              Euphoria <span className="collab-x">×</span> Oblivion · {EVENT.dateShort} · {EVENT.city}
            </p>
          </Reveal>
          <Wordmark className="wordmark pb-[0.14em] pr-[0.12em] text-[clamp(4.6rem,23vw,9rem)] lg:text-[clamp(6.5rem,12vw,12.5rem)]">
            euphoria
          </Wordmark>
          <Reveal immediate delay={700} className="mt-4 flex items-center gap-4">
            <span className="font-display text-3xl italic text-lilac sm:text-4xl">party</span>
            <span className="h-px max-w-40 flex-1 bg-gradient-to-r from-lilac/70 to-transparent" />
            <span className="eyebrow text-orchid">✦ ✦ ✦</span>
          </Reveal>
          <Reveal immediate delay={800}>
            <a
              href={EVENT.collab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass mt-7 inline-flex items-center gap-3 rounded-full px-5 py-2.5 transition-colors hover:border-orchid/60"
            >
              <span className="eyebrow !text-[0.66rem] text-ice/70">In collab with</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/oblivion-logo.png" alt={EVENT.collab.name} className="h-9 w-auto" />
              <span aria-hidden="true" className="text-orchid">↗</span>
            </a>
          </Reveal>
          <Reveal immediate delay={900}>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-ice/80 sm:text-xl">{EVENT.tagline}</p>
          </Reveal>

          <Reveal immediate delay={1000} className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/passes" className="btn btn-primary text-base">
              Get tickets <span aria-hidden="true">→</span>
            </Link>
            <a href="#night" className="btn btn-ghost text-base">
              See the night
            </a>
          </Reveal>

          <Reveal immediate delay={1150}>
            <EventHeroFacts />
          </Reveal>
        </div>

        <Reveal immediate variant="scale" delay={450}>
          <HeroVeil />
        </Reveal>
      </div>
    </section>
  );
}

function Marquee() {
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-y border-white/10 bg-ink/50 py-5 backdrop-blur-md"
    >
      <div>
        <div className="marquee-track">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center">
              {row.map((word, i) => (
                <span key={`${n}-${i}`} className="flex items-center">
                  <span className="font-display px-8 text-5xl italic text-ice/90 sm:text-6xl">{word}</span>
                  <span className="text-2xl text-orchid">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, text }) {
  return (
    <div>
      <Reveal>
        <p className="eyebrow mb-5">{eyebrow}</p>
      </Reveal>
      <Headline text={text} className="text-5xl sm:text-6xl lg:text-7xl" />
    </div>
  );
}

function Night() {
  return (
    <section id="night" data-scene="off" className="relative px-5 py-28 sm:px-8 sm:py-36">
      <TopographyBg />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHead eyebrow="The night" text="Step into *the glow.*" />
            <Reveal delay={250}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ice/75">
                Euphoria is one night of light, sound and sparkle built for teens in {EVENT.city}. Dress up, dance
                loud, and leave glittering.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {HIGHLIGHTS.map((item, i) => (
              <div key={item.title} className={i % 2 ? "sm:mt-12" : ""}>
                <Reveal variant="flip" delay={(i % 2) * 140}>
                  <Tilt max={10} lift={14} className="h-full rounded-[1.6rem]">
                    <article className="glass relative h-full overflow-hidden rounded-[1.6rem] p-7">
                      <span
                        aria-hidden="true"
                        className="absolute -right-4 -top-6 select-none font-display text-[9rem] italic leading-none text-white/[0.05]"
                      >
                        {item.glyph}
                      </span>
                      <span className="eyebrow !text-orchid">0{i + 1}</span>
                      <h3 className="font-display mt-10 text-4xl italic leading-none text-ice">{item.title}</h3>
                      <p className="mt-4 text-[0.95rem] leading-relaxed text-ice/70">{item.body}</p>
                    </article>
                  </Tilt>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// The sculpt stage stays clean: no shards, no other background.
function Inside() {
  return (
    <section id="inside" data-scene="off" className="relative">
      <SculptSection />
    </section>
  );
}

function Run() {
  return (
    <section id="run" data-scene="off" className="relative px-5 py-28 sm:px-8 sm:py-36">
      <SnowBg />
      <div className="mx-auto max-w-5xl">
        <SectionHead eyebrow="Run of show" text="How the night *unfolds.*" />
        <Timeline className="mt-16">
          <ol className="space-y-5">
            {RUN_OF_SHOW.map((step, i) => (
              <Reveal as="li" key={step.phase} variant={i % 2 ? "right" : "left"} className="relative pl-16 sm:pl-24">
                <StepDot className="glass !bg-[#160b2c] absolute left-0 top-1 grid h-[3.3rem] w-[3.3rem] place-items-center rounded-full font-mono text-sm text-orchid sm:h-[4.3rem] sm:w-[4.3rem] sm:text-base">
                  {step.phase}
                </StepDot>
                <div className="glass rounded-3xl px-6 py-5 sm:px-8 sm:py-6">
                  <h3 className="font-display text-4xl italic text-ice sm:text-5xl">{step.title}</h3>
                  <p className="mt-2 text-ice/70">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Timeline>
      </div>
    </section>
  );
}

function Details() {
  return (
    <section id="details" data-scene="off" className="relative px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Details" text="Everything *you need.*" />
        <EventDetailCards />
        <Reveal delay={200}>
          <p className="mt-8 text-sm text-ice/55">
            Euphoria is powered by{" "}
            <a
              href={EVENT.poweredBy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lilac underline decoration-lilac/40 underline-offset-4 transition-colors hover:text-white"
            >
              {EVENT.poweredBy.name}
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// The shards return for the finale.
function Tickets() {
  return (
    <section id="tickets" data-scene="center" data-flow="vortex" className="relative px-5 pb-28 pt-16 sm:px-8 sm:pb-40">
      <div className="mx-auto max-w-5xl">
        <Reveal variant="flip">
          <Tilt max={4} lift={16} className="rounded-[2.4rem]">
            <div className="glass relative overflow-hidden rounded-[2.4rem] px-6 py-16 text-center sm:px-16 sm:py-24">
              <Reveal>
                <p className="eyebrow relative mb-6">Euphoria <span className="collab-x">×</span> Oblivion · {EVENT.dateShort} · {EVENT.venue}</p>
              </Reveal>
              <Headline text="Be there. *Shine.*" className="relative text-6xl sm:text-8xl" />
              <Reveal delay={300}>
                <p className="relative mx-auto mt-6 max-w-md text-lg text-ice/75">
                  Explore the official passes and find your place on the floor.
                </p>
              </Reveal>
              <HomeTicketCTA />
            </div>
          </Tilt>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-ink/70 px-5 py-14 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 md:flex-row md:items-end">
        <Reveal variant="left">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="wordmark pb-[0.14em] pr-[0.1em] text-7xl">euphoria</p>
            <span className="collab-x text-4xl">×</span>
            <a href={EVENT.collab.url} target="_blank" rel="noopener noreferrer" aria-label="Oblivion on Instagram">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/oblivion-logo.png" alt="Oblivion" className="h-20 w-auto transition-opacity hover:opacity-80" />
            </a>
          </div>
          <p className="eyebrow mt-3">
            {EVENT.dateShort} · {EVENT.venue}, Jubilee Hills
            {EVENT.presentedBy ? ` · ${EVENT.presentedBy}` : ""}
          </p>
        </Reveal>
        <Reveal variant="right" delay={120}>
          <a
            href={EVENT.poweredBy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost group !gap-3 !px-5 !py-3 text-sm"
          >
            <span className="eyebrow !text-[0.64rem] text-ice/60">Powered by</span>
            <span className="font-semibold text-ice">{EVENT.poweredBy.name}</span>
            <span aria-hidden="true" className="text-orchid transition-transform group-hover:translate-x-0.5">
              ↗
            </span>
          </a>
        </Reveal>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <LiquidFx />
      <ScrollRefresh />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Night />
        <Inside />
        <Run />
        <Details />
        <Tickets />
      </main>
      <Footer />
    </>
  );
}
