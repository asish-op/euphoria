# Euphoria Party — Hyderabad

Next.js (App Router, JS, Tailwind v4). Powered by telugu.social (footer + details only — the organizer is separate).

```bash
npm run dev      # http://localhost:3000
npm run build
```

## Backend integration

Set the existing Express API URL in the root `.env` (see `.env.example`):

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

A bare backend origin automatically uses `/api`. Complete API base paths are preserved. Restart the development server or rebuild production after changing the value. The backend must allow the frontend origin and `Authorization`/`Content-Type` through CORS.

The existing landing-page design and effects remain. The header, hero, and tickets section now link to `/passes`; event date, venue, entry time, map, and optional countdown come from `/settings`.

- `/login`: registration and sign-in using the documented `hydhigh_token` Bearer session. Temporary network errors retain the token.
- `/passes`: live tiers and inventory, quantity constraints, admin-configured attendee and one-time steps, all nine field types, validation, terms, coupon/redeem/referral codes, and order creation. Availability and prices are checked again before submission.
- `/order/[orderId]`: authenticated buyer-owned status, Cashfree/Razorpay checkout and backend verification, manual UPI QR/instructions, UTR and screenshot submission, and payment failure reasons. Proof submission stays pending until backend approval.
- `/tickets`: confirmed passes, entry QR codes, grouped order history, attendee details, downloadable PDF invoices, and pending order recovery. `/bookings/pending` is optional; a saved order ID is checked through the authenticated order endpoint when unavailable.
- `/tos`: the backend-published event terms.

The API documentation and `example frontend/` are reference material and are not modified or served as application code. No backend or payment credentials are implemented here. The backend is authoritative for prices, inventory, orders, and payment confirmation.

Runtime order IDs require Next.js routing, so the previous `output: "export"` configuration has been removed. Deploy with a Next.js-capable host/runtime and `npm run build` / `npm start`; a plain static `out/` deployment cannot serve these order routes.

```bash
npm run lint
npm run build
npm test
```

Automated tests use isolated API and gateway fixtures, run against port 3001 in headless Microsoft Edge, and never create real accounts, orders, or payments. Live integration requires your configured running backend and payment sandbox.

## Event copy — `lib/event.js`
`date`, `venue`, and `presentedBy` remain optional landing-page fallbacks. Backend settings take precedence for event facts. Ticket buttons use the booking flow rather than the old external `ticketUrl` placeholder.
Highlight / run-of-show copy is also placeholder — check it matches the real event.

## Imagery — `public/images/`
`stage.jpg` (hero dither veil) and `disco-ball.jpg` (Pixel Sculpt) are procedurally rendered stand-ins
(`node scripts/generate-images.mjs`). Drop real art over the same filenames; nothing else changes.

## Effects
- `components/AeroShards.jsx` — WebGPU shard backdrop; `components/Backdrop.jsx` morphs it per section
  (`data-scene` / `data-flow` attributes on each `<section>`). Falls back to a CSS aurora without WebGPU.
- `components/DitherVeil.jsx` — hero image reveal (WebGL2, ogl).
- `components/PixelSculpt.jsx` — own implementation (three.js) of the Pixel Sculpt idea, since the React Bits Pro
  component is license-gated. To use the real one: set `REACTBITS_LICENSE_KEY`, configure the registry per
  https://pro.reactbits.dev/docs/installation, run `npx shadcn@latest add @reactbits-starter/pixel-sculpt-tw`,
  and swap the import in `components/SculptSection.jsx`.
