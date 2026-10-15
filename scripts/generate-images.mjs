// Procedurally renders the two placeholder key-art images used on the site.
// Run: node scripts/generate-images.mjs
// Swap public/images/*.jpg for real photography/art any time — the site only cares about the paths.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1800;
const H = 1200;

const rng = seed => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const rgb = ([r, g, b]) => `rgb(${Math.round(clamp(r) * 255)},${Math.round(clamp(g) * 255)},${Math.round(clamp(b) * 255)})`;

const star = (x, y, size, opacity = 1, color = '#fff') => {
  const s = size;
  const t = size * 0.14;
  return `<path d="M${x} ${y - s} L${x + t} ${y - t} L${x + s} ${y} L${x + t} ${y + t} L${x} ${y + s} L${x - t} ${y + t} L${x - s} ${y} L${x - t} ${y - t} Z" fill="${color}" opacity="${opacity}"/>`;
};

// ── Disco ball ────────────────────────────────────────────────────────────────
const discoBall = () => {
  const rand = rng(11);
  const cx = W / 2;
  const cy = H / 2 + 30;
  const R = 430;
  const tilt = -0.32; // pitch, so the top pole leans toward the viewer
  const rows = 34;
  const keyDir = normalize([-0.55, -0.6, 0.6]);
  const fillDir = normalize([0.7, 0.5, 0.35]);
  const tiles = [];
  const sparkles = [];

  function normalize(v) {
    const l = Math.hypot(...v);
    return v.map(c => c / l);
  }
  const rotate = ([x, y, z]) => {
    const c = Math.cos(tilt);
    const s = Math.sin(tilt);
    return [x, y * c - z * s, y * s + z * c];
  };
  const point = (lat, lon) => rotate([Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]);

  for (let r = 0; r < rows; r++) {
    const lat0 = -Math.PI / 2 + (r / rows) * Math.PI;
    const lat1 = -Math.PI / 2 + ((r + 1) / rows) * Math.PI;
    const mid = (lat0 + lat1) / 2;
    const cols = Math.max(6, Math.round(rows * 2 * Math.cos(mid)));
    const shift = rand() * Math.PI * 2;
    for (let c = 0; c < cols; c++) {
      const lon0 = shift + (c / cols) * Math.PI * 2;
      const lon1 = shift + ((c + 1) / cols) * Math.PI * 2;
      const gap = 0.14;
      const dLat = (lat1 - lat0) * gap;
      const dLon = (lon1 - lon0) * gap;
      const corners = [
        point(lat0 + dLat, lon0 + dLon),
        point(lat0 + dLat, lon1 - dLon),
        point(lat1 - dLat, lon1 - dLon),
        point(lat1 - dLat, lon0 + dLon)
      ];
      const n = normalize(point(mid, (lon0 + lon1) / 2));
      if (n[2] <= 0.02) continue;
      const depth = n[2];
      const key = Math.max(0, n[0] * keyDir[0] + n[1] * keyDir[1] + n[2] * keyDir[2]);
      const fill = Math.max(0, n[0] * fillDir[0] + n[1] * fillDir[1] + n[2] * fillDir[2]);
      // Every mirror faces a slightly different way, so each catches light differently.
      const jitter = rand();
      const flash = Math.pow(jitter, 5) * 1.6;
      const base = 0.1 + jitter * 0.22;
      const violet = [0.36, 0.14, 0.78];
      const magenta = [0.95, 0.3, 0.85];
      const ice = [0.85, 0.82, 1];
      const lum = clamp(base + Math.pow(key, 2.2) * 0.75 + fill * 0.25 + flash * (0.4 + key));
      const rim = Math.pow(1 - depth, 1.6);
      let col = [
        mix(violet[0], ice[0], lum) * lum * 1.35 + magenta[0] * fill * 0.18,
        mix(violet[1], ice[1], lum) * lum * 1.25 + magenta[1] * fill * 0.05,
        mix(violet[2], ice[2], lum) * lum * 1.35 + magenta[2] * fill * 0.16
      ].map(v => v * (1 - rim * 0.55));
      const pts = corners.map(([x, y]) => `${(cx + x * R).toFixed(1)},${(cy - y * R).toFixed(1)}`).join(' ');
      tiles.push(`<polygon points="${pts}" fill="${rgb(col)}"/>`);
      if (flash > 1.05 && depth > 0.3) {
        const [px, py] = corners.reduce(([ax, ay], [x, y]) => [ax + x / 4, ay + y / 4], [0, 0]);
        sparkles.push(star(cx + px * R, cy - py * R, 16 + flash * 26, clamp(flash - 0.2)));
      }
    }
  }

  // Background glitter and drifting stars.
  const dust = [];
  for (let i = 0; i < 260; i++) {
    dust.push(`<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * H).toFixed(0)}" r="${(0.6 + rand() * 1.8).toFixed(1)}" fill="#e9d5ff" opacity="${(0.15 + rand() * 0.6).toFixed(2)}"/>`);
  }
  const bigStars = [];
  for (let i = 0; i < 26; i++) {
    const x = rand() * W;
    const y = rand() * H;
    if (Math.hypot(x - cx, y - cy) < R * 0.92) continue;
    bigStars.push(star(x, y, 10 + rand() * 30, 0.35 + rand() * 0.6, rand() > 0.5 ? '#f5d0fe' : '#ddd6fe'));
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="52%" r="75%">
      <stop offset="0" stop-color="#2a1050"/><stop offset="0.55" stop-color="#120722"/><stop offset="1" stop-color="#05020b"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0.6" stop-color="#a855f7" stop-opacity="0.55"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${dust.join('')}
  <circle cx="${cx}" cy="${cy}" r="${R * 1.45}" fill="url(#halo)"/>
  <rect x="${cx - 3}" y="0" width="6" height="${cy - R + 8}" fill="#c4b5fd" opacity="0.55"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="#0b0416"/>
  ${tiles.join('')}
  <g filter="url(#soft)" opacity="0.9">${sparkles.join('')}</g>
  ${sparkles.join('')}
  ${bigStars.join('')}
</svg>`;
};

// ── Stage / light beams ───────────────────────────────────────────────────────
const stage = () => {
  const rand = rng(29);
  const cx = W / 2;
  const source = { x: cx, y: 210 };
  const beams = [];
  const count = 15;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = mix(-1.05, 1.05, t) + (rand() - 0.5) * 0.08;
    const length = 1500;
    const spread = 0.028 + rand() * 0.03;
    const hue = rand();
    const color = hue > 0.66 ? '#f0abfc' : hue > 0.33 ? '#c084fc' : '#a5b4fc';
    const lx = source.x + Math.sin(angle - spread) * length;
    const ly = source.y + Math.cos(angle - spread) * length;
    const rx = source.x + Math.sin(angle + spread) * length;
    const ry = source.y + Math.cos(angle + spread) * length;
    beams.push(`<polygon points="${source.x},${source.y} ${lx.toFixed(0)},${ly.toFixed(0)} ${rx.toFixed(0)},${ry.toFixed(0)}" fill="url(#beam-${i % 3})" opacity="${(0.5 + rand() * 0.5).toFixed(2)}"/>`);
    beams[beams.length - 1] = beams[beams.length - 1].replace('url(#beam-', `url(#beam-`);
    void color;
  }

  // Compact mirror ball at the origin of the beams.
  const ballR = 120;
  const facets = [];
  for (let r = 0; r < 12; r++) {
    const lat0 = -Math.PI / 2 + (r / 12) * Math.PI;
    const lat1 = -Math.PI / 2 + ((r + 1) / 12) * Math.PI;
    const cols = Math.max(5, Math.round(24 * Math.cos((lat0 + lat1) / 2)));
    for (let c = 0; c < cols; c++) {
      const lon0 = (c / cols) * Math.PI * 2 - Math.PI / 2;
      const lon1 = ((c + 1) / cols) * Math.PI * 2 - Math.PI / 2;
      const mid = (lon0 + lon1) / 2;
      const z = Math.cos((lat0 + lat1) / 2) * Math.cos(mid);
      if (z < 0) continue;
      const tone = clamp(0.25 + rand() * 0.55 + Math.max(0, -Math.sin(mid) * 0.3));
      const p = (lat, lon) => `${(cx + Math.cos(lat) * Math.sin(lon) * ballR).toFixed(1)},${(source.y - Math.sin(lat) * ballR).toFixed(1)}`;
      facets.push(`<polygon points="${p(lat0 + 0.02, lon0 + 0.02)} ${p(lat0 + 0.02, lon1 - 0.02)} ${p(lat1 - 0.02, lon1 - 0.02)} ${p(lat1 - 0.02, lon0 + 0.02)}" fill="${rgb([tone * 0.95, tone * 0.8, 1])}"/>`);
    }
  }

  const stars = [];
  for (let i = 0; i < 70; i++) {
    const x = rand() * W;
    const y = rand() * H * 0.75;
    stars.push(star(x, y, 5 + rand() * 20, 0.2 + rand() * 0.7, '#f5d0fe'));
  }
  const dust = [];
  for (let i = 0; i < 420; i++) {
    dust.push(`<circle cx="${(rand() * W).toFixed(0)}" cy="${(rand() * H).toFixed(0)}" r="${(0.6 + rand() * 1.6).toFixed(1)}" fill="#f5d0fe" opacity="${(0.1 + rand() * 0.5).toFixed(2)}"/>`);
  }
  // Floor tiles catching the beams.
  const floorY = 860;
  const floor = [];
  for (let i = 0; i < 26; i++) {
    const y = floorY + Math.pow(i / 26, 1.6) * (H - floorY);
    floor.push(`<line x1="0" y1="${y.toFixed(0)}" x2="${W}" y2="${y.toFixed(0)}" stroke="#c084fc" stroke-opacity="${(0.05 + (i / 26) * 0.12).toFixed(2)}" stroke-width="${(1 + i * 0.1).toFixed(1)}"/>`);
  }
  for (let i = -20; i <= 20; i++) {
    floor.push(`<line x1="${cx + i * 40}" y1="${floorY}" x2="${cx + i * 190}" y2="${H}" stroke="#c084fc" stroke-opacity="0.09" stroke-width="1.5"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a0414"/><stop offset="0.7" stop-color="#180a30"/><stop offset="1" stop-color="#2a0f4d"/>
    </linearGradient>
    ${[0, 1, 2]
      .map(
        i => `<linearGradient id="beam-${i}" gradientUnits="userSpaceOnUse" x1="${source.x}" y1="${source.y}" x2="${source.x}" y2="${H}">
      <stop offset="0" stop-color="${['#ffffff', '#f5d0fe', '#c7d2fe'][i]}" stop-opacity="0.95"/>
      <stop offset="0.55" stop-color="${['#c084fc', '#e879f9', '#818cf8'][i]}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${['#a855f7', '#d946ef', '#6366f1'][i]}" stop-opacity="0"/>
    </linearGradient>`
      )
      .join('')}
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.25" stop-color="#e879f9" stop-opacity="0.6"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pool" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#e9d5ff" stop-opacity="0.75"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="bloom" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="70"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${dust.join('')}
  <g filter="url(#blur)">${beams.join('')}</g>
  <g opacity="0.55">${beams.join('')}</g>
  <ellipse cx="${cx}" cy="${floorY + 60}" rx="760" ry="120" fill="url(#pool)" filter="url(#blur)"/>
  ${floor.join('')}
  <circle cx="${cx}" cy="${source.y}" r="170" fill="#e879f9" opacity="0.75" filter="url(#bloom)"/>
  <rect x="${cx - 3}" y="0" width="6" height="${source.y - ballR + 6}" fill="#e9d5ff" opacity="0.7"/>
  <circle cx="${cx}" cy="${source.y}" r="${ballR}" fill="#1a0a33"/>
  ${facets.join('')}
  <g filter="url(#soft)">${stars.join('')}</g>
  ${stars.join('')}
</svg>`;
};

await mkdir('public/images', { recursive: true });
await sharp(Buffer.from(discoBall())).jpeg({ quality: 88, mozjpeg: true }).toFile('public/images/disco-ball.jpg');
await sharp(Buffer.from(stage())).jpeg({ quality: 88, mozjpeg: true }).toFile('public/images/stage.jpg');
console.log('wrote public/images/disco-ball.jpg and stage.jpg');
