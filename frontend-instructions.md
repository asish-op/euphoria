# Frontend Build Instructions for AI

> **Purpose:** This document tells an AI assistant how to build the HYDHIGH customer frontend from scratch. It connects to an existing Express.js backend API.

---

## Project Overview

**HYDHIGH** is a youth party/event ticketing platform. The customer-facing frontend needs **3 core pages** that interact with the backend:

1. **Login / Register** — Email-based auth with JWT
2. **Buy Passes** — Multi-step form: Auth → Quantity → [Dynamic form steps] → Payment
3. **My Passes** — Dashboard showing purchased passes with QR codes and invoices

All other pages (home, about, contact, etc.) are purely frontend and don't call the API.

---

## Backend API

**Base URL:** Set via environment variable, e.g. `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`

**Full API docs:** See `FRONTEND_API_DOCS.md` for complete endpoint details, payloads, and responses.

**Auth:** JWT token stored in `localStorage` as `hydhigh_token`. Attached as `Authorization: Bearer <token>` header.

---

## Reference Code

The following files are kept in the repo as reference for how the current frontend works:

| File | Purpose |
|---|---|
| `src/app/passes/page.tsx` | Multi-step purchase flow with Cashfree, Razorpay, manual UPI, and secure order-status resume |
| `src/app/tickets/page.tsx` | Purchased passes dashboard with QR, invoices, order history |
| `src/app/order/[orderId]/page.tsx` | Secure order status link (auth-only, payment status) |
| `src/contexts/AuthContext.tsx` | Auth context provider (login, signup, logout, token management) |
| `src/lib/api.ts` | Complete API client with all endpoints and TypeScript interfaces |

---

## Page 1: Login / Register

### Behavior
- Toggle between Login and Register mode
- **Register:** name, email, password → `POST /auth/register`
- **Login:** email, password → `POST /auth/login`
- Both return `{ token, user: { id, name, email } }`
- Store token in `localStorage` as `hydhigh_token`
- Redirect to buy page or my-passes after auth

### API Endpoints
```
POST /auth/register  → { name, email, password } → { token, user }
POST /auth/login     → { email, password }        → { token, user }
GET  /auth/me        → (with Bearer token)        → { id, name, email }
```

---

## Page 2: Buy Passes (Multi-Step Form)

This is the most complex page. It follows a **step-based flow** where some steps are fixed and some are dynamically configured by the admin.

### Fixed Steps (Always Present)

#### Step 1: Auth Check
- If user is not logged in, show login/register form
- Once authenticated, auto-advance to next step

#### Step 2: Quantity & Pass Selection
- Fetch pass types: `GET /pass-types`
- Display available passes (filter by `status === "On Sale"` or `"Opening Soon"`)
- User selects a pass type and quantity (1 to `maxPassesPerBooking` from settings)
- Show price calculation

### Dynamic Steps (From Admin Form Builder)

- Fetch form config: `GET /form-config`
- Response contains a `steps` array, each step having:
  ```json
  {
    "name": "Personal Information",
    "sortOrder": 0,
    "repeatPerAttendee": true,
    "fields": [
      { "key": "name", "label": "Full Name", "type": "text", "required": true, "enabled": true, ... },
      { "key": "email", "label": "Email", "type": "email", "required": true, ... },
      ...
    ]
  }
  ```
- Sort steps by `sortOrder`
- **If `repeatPerAttendee === true`:** Show the step for each attendee (based on quantity). E.g., if quantity is 3, show "Personal Information" 3 times.
- **If `repeatPerAttendee === false`:** Show the step once for the entire booking.
- Within each step, filter fields where `enabled === true`, sort by `sortOrder`
- Render each field based on `type`:
  - `text` → text input
  - `email` → email input
  - `phone` → tel input
  - `number` → number input (use `validation.min`/`max`)
  - `select` → dropdown with `options`
  - `multiselect` → multi-select chips/checkboxes from `options`
  - `textarea` → textarea
  - `checkbox` → single checkbox
  - `radio` → radio group from `options`
- Validate `required` fields before advancing

### Step Flow Calculation

```
Total steps = 1 (Auth) + 1 (Quantity) + [dynamic steps] + 1 (Payment)

For dynamic steps:
- Per-attendee steps appear (quantity × count_of_per_attendee_steps) times
- One-time steps appear once each
- Example: 2 attendees, 2 per-attendee steps, 1 one-time step
  = Step 1: Auth
  = Step 2: Quantity  
  = Step 3: Attendee 1 - Personal Info
  = Step 4: Attendee 1 - Preferences
  = Step 5: Attendee 2 - Personal Info
  = Step 6: Attendee 2 - Preferences
  = Step 7: Additional Info (once)
  = Step 8: Review & Payment
```

### Coupon / Redeem / Referral (Optional)

Show input fields on the quantity or payment step:

```
POST /coupons/validate     → { code, cartAmount } → { valid, discount, maxDiscount }
POST /redeem-codes/validate → { code } → { valid, passType, freePassCount }
POST /referrals/validate    → { code } → { valid, referral: { ownerName, code } }
```

- Coupons give percentage discount (capped at `maxDiscount`)
- Redeem codes give free passes entirely
- Referral codes are tracked for attribution

### Payment Flow (Cashfree / Razorpay / Manual UPI)

1. **Create order:** `POST /bookings/create-order`
   ```json
   {
     "tierName": "VIP Pass",
     "attendees": [{ "name": "...", "email": "...", "phone": "...", ...otherFields }],
     "additionalInfo": { "hearAbout": "...", "attendedBefore": "...", "agreeTerms": true },
     "couponCode": "SAVE20",
     "redeemCode": "",
     "referralCode": ""
   }
   ```
   - The `attendees` array: each attendee object has keys matching field `key` from form-config (for per-attendee steps).
   - `additionalInfo`: keys match field `key` from one-time steps, plus `agreeTerms`.

2. **Handle the response by gateway:**
   - Cashfree response: `{ orderId, gateway: "cashfree", paymentMethod: "Cashfree", cfOrderId, paymentSessionId, cashfreeMode, amount, currency, ... }`
   - Razorpay response: `{ orderId, gateway: "razorpay", paymentMethod: "Razorpay", rzpOrderId, razorpayOrderId, razorpayKeyId, amount, amountInSubunits, currency, ... }`
   - Manual response: `{ manual: true, orderId, upiId, upiPaymentUrl, paymentNote, amount, currency, ... }`
   - Free response: `{ success: true, free: true, passes: [...] }` and you can skip payment entirely.

3. **Start checkout:**
   - Cashfree: load `https://sdk.cashfree.com/js/v3/cashfree.js`, then call `window.Cashfree({ mode }).checkout({ paymentSessionId, redirectTarget: "_modal" })`.
   - Razorpay: load `https://checkout.razorpay.com/v1/checkout.js`, then open checkout with `key`, `order_id`, `amount`, `currency`, `prefill`, and a `handler` that returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
   - Manual UPI: redirect to the secure order-status page `/order/:orderId` and show UTR / proof submission there.

4. **Verify payment after success:**
   - Cashfree verify request: `POST /bookings/verify-payment` with `{ orderId, attendees, additionalInfo }`.
   - Razorpay verify request: `POST /bookings/verify-payment` with `{ orderId, attendees, additionalInfo, razorpayPaymentId, razorpayOrderId, razorpaySignature }`.
   - Success response: `{ success: true, orderId, paymentId, cfPaymentId?, rzpPaymentId?, passes: [...] }`.

5. **Persist + use the secure order link:**
   - Keep `orderId` in `localStorage` as `pending_order_id`.
   - Use `/order/:orderId` as the single source of truth for retries and manual-payment instructions.
   - The status endpoint `GET /bookings/order/:orderId` now returns gateway-specific fields such as `paymentSessionId`, `cashfreeMode`, `rzpOrderId`, `razorpayKeyId`, `paymentFailureReason`, and `adminReviewNote`.
   - For a smooth UX, newly created online orders can redirect to `/order/:orderId?startPayment=1` so the checkout auto-opens there.

6. **Manual UPI proof submission:**
   - Call `POST /bookings/manual-proof` with `{ orderId, manualUtr, paymentProofDataUrl }`.
   - If the admin rejects a manual payment, show `paymentFailureReason` / `adminReviewNote` on the order-status page.

7. **Payment Success Page:**
   - This is frontend-only (no API call needed).
   - Show success animation, booking summary, pass details, and link to My Passes.
   - Display pass IDs / ticket IDs.
### Event Settings (for display)

```
GET /settings → { eventName, eventDate, venue, currencySymbol, maxPassesPerBooking, ... }
```

Use `currencySymbol` for price display, `maxPassesPerBooking` to cap the quantity selector.

---

## Page 3: My Passes

### Behavior
- Requires authentication
- Fetch: `GET /bookings/my` (with auth token)
- Render an **Order History** box at the top, aggregating `/bookings/my` by `orderId` (status, method, amount, qty) with a link to `/order/:orderId` for each entry.
- Returns array of `BookingPass` objects
- Display each pass with:
  - Ticket ID, pass type, buyer name
  - QR code (generate from ticket ID client-side using a QR library)
  - Purchase date, payment status
  - Attendee details

### Invoice Generation
- Generate PDF invoice client-side using a library like `jspdf` or `html2canvas`
- Include: event name, pass type, price, ticket ID, purchase date, attendee info

---

## Data Models (TypeScript)

```typescript
interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface PassType {
  _id: string;
  name: string;
  price: number | null;
  originalPrice?: number | null;
  subtitle?: string;
  entryTime: string;
  perks: string[];
  badge?: string | null;
  badgeColor?: string;
  featured: boolean;
  status: "Opening Soon" | "On Sale" | "Sold Out" | "Ended";
  totalQuantity: number;
  soldCount: number;
  sortOrder: number;
}

interface FormStep {
  _id: string;
  name: string;
  sortOrder: number;
  repeatPerAttendee: boolean;
  fields: FormField[];
}

interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "select" | "multiselect" | "textarea" | "checkbox" | "radio";
  placeholder: string;
  required: boolean;
  options: string[];
  validation: {
    minLength: number | null;
    maxLength: number | null;
    min: number | null;
    max: number | null;
    pattern: string;
  };
  sortOrder: number;
  enabled: boolean;
}

interface FormConfig {
  steps: FormStep[];
  showTerms: boolean;
  termsLabel: string;
}

interface BookingPass {
  id: string;
  passType: string;
  buyerName: string;
  email: string;
  phone: string;
  status: string;
  ticketId: string;
  price: number;
  purchaseDate: string;
  orderId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  attendee: Record<string, unknown> | null;
  additionalInfo?: Record<string, unknown>;
  tierPrice: number;
  appliedCoupon: { code: string; discount: number } | null;
}
```

---

## Tech Stack Recommendations

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **QR Code:** `qrcode.react` or similar
- **PDF:** `jspdf` + `html2canvas` for invoice generation
- **Icons:** Lucide React
- **Payment:** Cashfree JS SDK v3 (`https://sdk.cashfree.com/js/v3/cashfree.js`) and Razorpay Checkout (`https://checkout.razorpay.com/v1/checkout.js`)

---

## API Summary Table

| Endpoint | Auth Required | Method |
|---|---|---|
| `/auth/register` | No | POST |
| `/auth/login` | No | POST |
| `/auth/me` | Yes | GET |
| `/settings` | No | GET |
| `/form-config` | No | GET |
| `/pass-types` | No | GET |
| `/coupons/validate` | No | POST |
| `/redeem-codes/validate` | No | POST |
| `/referrals/validate` | No | POST |
| `/bookings/create-order` | Yes | POST |
| `/bookings/verify-payment` | Yes | POST |
| `/bookings/manual-proof` | Yes | POST |
| `/bookings/order/:orderId` | Yes | GET |
| `/bookings/my` | Yes | GET |

---

## Important Notes

1. **The backend already exists** — do NOT create any backend code. Only build the frontend.
2. **Form fields are dynamic** — the admin can add/remove/reorder steps and fields. Never hardcode field names except the 3 core fields (`name`, `email`, `phone`).
3. **Payment success page** is purely frontend — just show a success message, pass details, and link to My Passes.
4. **Terms checkbox** — if `showTerms` is true in form config, show a checkbox with `termsLabel` text.
5. **The `BASE` URL** in the API client must be configurable via environment variable.
6. **Gateway resume** - `/bookings/order/:orderId` is the secure source of truth for Cashfree retries, Razorpay retries, manual UPI instructions, and failure reasons.
7. **Cashfree mode** — use `"sandbox"` for development, `"production"` for live. Prefer the backend-provided `cashfreeMode` value when available.
8. **Token key** — always use `hydhigh_token` as the localStorage key.
