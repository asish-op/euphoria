// Single source of truth for event copy. Anything marked TODO is a placeholder —
// replace it with the real detail before launch.
export const EVENT = {
  name: 'Euphoria',
  kind: 'Party',
  city: 'Hyderabad',
  tagline: 'Glitter. Stars. Disco. One night that glows.',

  // TODO: real date / venue / audience. Leave null to show "Announcing soon".
  date: null,
  venue: null,
  audience: 'Teens',

  // TODO: paste the ticket / RSVP link here. While null, the tickets section shows the "opening soon" state.
  ticketUrl: null,

  // TODO: the main organizer (shown in the footer if set). telugu.social is the platform, not the organizer.
  presentedBy: null,

  poweredBy: { name: 'telugu.social', url: 'https://telugu.social' }
};

export const NAV = [
  { href: '#night', label: 'The night' },
  { href: '#inside', label: 'Inside' },
  { href: '#run', label: 'Run of show' },
  { href: '#details', label: 'Details' }
];

export const HIGHLIGHTS = [
  {
    title: 'The Disco Floor',
    body: 'A mirror-ball ceiling, beams cutting through haze, and a floor built for dancing until your feet give up.',
    glyph: '✦'
  },
  {
    title: 'Glitter Bar',
    body: 'Face gems, body glitter and star stickers. Show up plain, leave sparkling.',
    glyph: '✧'
  },
  {
    title: 'Starlit Photo Corner',
    body: 'A mirrored, star-lit backdrop made for the photos you will post at 2 a.m. (or, well, 10 p.m.).',
    glyph: '◇'
  },
  {
    title: 'Dress: Shimmer',
    body: 'Purples, silvers, sequins, sheer, sparkle. If it catches the light, it belongs here.',
    glyph: '❖'
  }
];

export const RUN_OF_SHOW = [
  { phase: '01', title: 'Doors', body: 'Arrive, check in, get your glitter on.' },
  { phase: '02', title: 'Warm-up', body: 'The lights come up slow. The floor starts to fill.' },
  { phase: '03', title: 'Peak', body: 'Full disco. Every beam on. Everyone in.' },
  { phase: '04', title: 'Last dance', body: 'One final song, hands up, stars out.' }
];
