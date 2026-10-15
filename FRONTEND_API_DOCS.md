# Frontend API Documentation

> **Base URL**: `http://localhost:5000/api` (or your deployed backend URL)
>
> This document describes every public API endpoint the frontend needs. The admin panel has its own authenticated routes not covered here.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Event Settings](#2-event-settings)
3. [Form Configuration](#3-form-configuration)
4. [Pass Types](#4-pass-types)
5. [Bookings (Buy Pass Flow)](#5-bookings-buy-pass-flow)
6. [Coupon / Redeem / Referral Validation](#6-coupon--redeem--referral-validation)
7. [My Passes (Dashboard)](#7-my-passes-dashboard)
8. [Complete Flow Example](#8-complete-flow-example)
9. [Data Models Reference](#9-data-models-reference)
10. [Error Handling](#10-error-handling)

---

## 1. Authentication

All user-facing endpoints (bookings, my passes) require a Bearer token.

### POST `/auth/register`

Create a new frontend user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "acc_abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST `/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "acc_abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### GET `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "acc_abc123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## 2. Event Settings

**No authentication required.** Use this to configure the entire frontend dynamically.

### GET `/settings`

Returns the complete event configuration.

**Response:**
```json
{
  "_id": "main",
  "eventName": "HYDHIGH",
  "tagline": "The Ultimate Party Experience",
  "description": "Hyderabad's biggest college fest...",
  "eventDate": "2025-03-15",
  "eventEndDate": "2025-03-15",
  "eventStatus": "upcoming",
  "venueName": "Rumor — Sky Lounge",
  "venueAddress": "Jubilee Hills, Hyderabad",
  "venueMapEmbed": "https://www.google.com/maps/embed?pb=...",
  "venueCapacity": 500,
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#FFD900",
  "secondaryColor": "#0a2e38",
  "accentColor": "#ff6b6b",
  "maxPassesPerBooking": 10,
  "currency": "INR",
  "currencySymbol": "₹",
  "entryTime": "5:00 PM",
  "paymentGateway": "cashfree",
  "contactEmail": "hello@hydhigh.com",
  "contactPhone": "+91 9876543210",
  "socialLinks": {
    "instagram": "https://instagram.com/hydhigh",
    "twitter": "",
    "website": "https://hydhigh.com"
  },
  "termsText": "By purchasing a pass...",
  "privacyText": "",
  "idPrefixes": {
    "order": "ORD",
    "user": "USR",
    "coupon": "CPN",
    "redeem": "RDM",
    "referral": "REF"
  },
  "showVenueMap": true,
  "showEventCountdown": true,
  "showStatistics": true
}
```

**Frontend Usage:**
- `eventName` → Page title, header, branding
- `tagline` → Hero section subtitle
- `description` → About section
- `eventDate`, `eventEndDate` → Countdown timer, event info
- `eventStatus` → Show "upcoming"/"live"/"ended"/"cancelled" states
- `venueName`, `venueAddress`, `venueMapEmbed` → Venue section / Google Maps embed
- `primaryColor`, `secondaryColor`, `accentColor` → CSS variables for theming
- `logoUrl` → Header/hero logo
- `currencySymbol` → Price display (e.g. "₹799")
- `maxPassesPerBooking` → Limit the quantity selector
- `entryTime` → Display on pass cards
- `socialLinks` → Footer/contact section
- `termsText` → Terms modal
- `showVenueMap`, `showEventCountdown`, `showStatistics` → Toggle sections on/off

---

## 3. Form Configuration

**No authentication required.** Use this to dynamically build the multi-step attendee form.

### GET `/form-config`

Returns the step-based form configuration. The form is organized into **steps**, each containing fields.

**Response:**
```json
{
  "_id": "main",
  "steps": [
    {
      "_id": "...",
      "name": "Personal Information",
      "sortOrder": 0,
      "repeatPerAttendee": true,
      "fields": [
        {
          "key": "name",
          "label": "Full Name",
          "type": "text",
          "placeholder": "",
          "required": true,
          "options": [],
          "validation": { "minLength": null, "maxLength": null, "min": null, "max": null, "pattern": "" },
          "sortOrder": 0,
          "enabled": true
        },
        {
          "key": "email",
          "label": "Email",
          "type": "email",
          "required": true,
          "sortOrder": 1,
          "enabled": true,
          "options": [],
          "placeholder": "",
          "validation": {}
        },
        {
          "key": "phone",
          "label": "Phone Number",
          "type": "phone",
          "required": true,
          "sortOrder": 2,
          "enabled": true,
          "options": [],
          "placeholder": "",
          "validation": {}
        },
        {
          "key": "age",
          "label": "Age",
          "type": "number",
          "required": false,
          "sortOrder": 3,
          "enabled": true,
          "options": [],
          "placeholder": "",
          "validation": { "min": 1, "max": 120 }
        },
        {
          "key": "gender",
          "label": "Gender",
          "type": "select",
          "required": false,
          "sortOrder": 4,
          "enabled": true,
          "options": ["Male", "Female", "Non-Binary", "Prefer not to say"],
          "placeholder": "",
          "validation": {}
        }
      ]
    },
    {
      "_id": "...",
      "name": "Preferences",
      "sortOrder": 1,
      "repeatPerAttendee": true,
      "fields": [
        {
          "key": "musicPreferences",
          "label": "Music Preferences",
          "type": "multiselect",
          "required": false,
          "sortOrder": 0,
          "enabled": true,
          "options": ["EDM", "Hip-Hop", "Bollywood", "Techno", "House", "Pop", "Rock", "R&B", "Classical", "Other"],
          "placeholder": "",
          "validation": {}
        }
      ]
    },
    {
      "_id": "...",
      "name": "Additional Info",
      "sortOrder": 2,
      "repeatPerAttendee": false,
      "fields": [
        {
          "key": "hearAbout",
          "label": "How did you hear about us?",
          "type": "select",
          "required": false,
          "sortOrder": 0,
          "enabled": true,
          "options": ["Instagram", "Friends", "College", "Twitter", "Other"]
        },
        {
          "key": "attendedBefore",
          "label": "Have you attended before?",
          "type": "radio",
          "required": false,
          "sortOrder": 1,
          "enabled": true,
          "options": ["Yes", "No"]
        }
      ]
    }
  ],
  "showTerms": true,
  "termsLabel": "I agree to the terms and conditions"
}
```

**Step schema:**
| Field | Type | Description |
|---|---|---|
| `name` | string | Display name for the step |
| `sortOrder` | number | Order of appearance (0-based) |
| `repeatPerAttendee` | boolean | If `true`, step is shown for each attendee. If `false`, shown once per booking. |
| `fields` | array | Fields within this step |

**Field schema:**
| Field | Type | Description |
|---|---|---|
| `key` | string | Unique identifier (used in booking submission) |
| `label` | string | Display label |
| `type` | string | One of: `text`, `email`, `phone`, `number`, `select`, `multiselect`, `textarea`, `checkbox`, `radio` |
| `placeholder` | string | Placeholder text |
| `required` | boolean | Validation requirement |
| `options` | string[] | Options for select/multiselect/radio types |
| `validation` | object | `{ minLength, maxLength, min, max, pattern }` |
| `sortOrder` | number | Display order within the step |
| `enabled` | boolean | Whether to display this field |

**How to build the multi-step form:**

1. Fetch `/form-config`
2. The **fixed flow** is: **Auth → Quantity → [Dynamic Steps] → Payment**
3. Sort `steps` by `sortOrder`
4. For each step:
   - If `repeatPerAttendee === true`: show for each attendee (based on quantity)
   - If `repeatPerAttendee === false`: show once for the entire booking
5. Within each step, filter fields where `enabled === true`, sort by `sortOrder`
6. Render fields by `type`:
   - `"text"` → `<input type="text">`
   - `"email"` → `<input type="email">`
   - `"phone"` → `<input type="tel">`
   - `"number"` → `<input type="number">` (use `validation.min`/`validation.max`)
   - `"select"` → `<select>` with `options`
   - `"multiselect"` → Checkbox group or multi-select chips from `options`
   - `"textarea"` → `<textarea>`
   - `"checkbox"` → `<input type="checkbox">`
   - `"radio"` → Radio group from `options`
7. Use `required` for validation, `placeholder` for hint text
7. If `showTerms` is true, show a checkbox with `termsLabel`

**When submitting to `/bookings/create-order`**, send each attendee as an object with keys matching field `key` values. Example:
```json
{
  "name": "John",
  "email": "john@example.com",
  "phone": "+919876543210",
  "age": 21,
  "gender": "Male",
  "musicPreferences": ["EDM", "Techno"]
}
```

---

## 4. Pass Types

**No authentication required.**

### GET `/pass-types`

Returns all available pass tiers, sorted by `sortOrder`.

**Response:**
```json
[
  {
    "id": "early-bird",
    "name": "Early Bird",
    "price": 799,
    "originalPrice": 999,
    "subtitle": "Limited availability",
    "entryTime": "5:00 PM",
    "perks": ["Entry Pass", "Welcome Drink", "DJ Night"],
    "badge": "BEST VALUE",
    "badgeColor": "var(--yellow-neon)",
    "featured": true,
    "status": "On Sale",
    "totalQuantity": 100,
    "soldCount": 34,
    "sortOrder": 0
  },
  {
    "id": "vip",
    "name": "VIP",
    "price": 1499,
    "originalPrice": 1999,
    "subtitle": "Premium experience",
    "entryTime": "4:00 PM",
    "perks": ["Early Entry", "VIP Lounge", "Free Drinks", "Backstage Access"],
    "badge": "VIP",
    "badgeColor": "#ff6b6b",
    "featured": false,
    "status": "On Sale",
    "totalQuantity": 50,
    "soldCount": 12,
    "sortOrder": 1
  }
]
```

**Frontend Usage:**
- Only show passes where `status === "On Sale"`
- Display `"Opening Soon"`, `"Sold Out"`, `"Ended"` as disabled states
- Use `totalQuantity - soldCount` for "X left" display
- `price` = current price, `originalPrice` = strikethrough price
- `featured` → highlight card
- `badge` + `badgeColor` → ribbon/tag on card
- `perks` → bullet list of features
- Pass `name` as `tierName` when creating a booking

### GET `/pass-types/:id`

Get a single pass type by ID.

---

## 5. Bookings (Buy Pass Flow)

**All endpoints require `Authorization: Bearer <token>`**

### POST `/bookings/create-order`

Creates a payment order (or auto-completes if the total is ₹0).

**Request:**
```json
{
  "tierName": "Early Bird",
  "attendees": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "age": 21,
      "gender": "Male",
      "college": "IIT Hyderabad",
      "instagram": "@johndoe",
      "musicPreferences": ["EDM", "Techno"],
      "foodPreference": "Non-Veg",
      "contentPreference": "Music",
      "sexuality": "Prefer not to say"
    }
  ],
  "additionalInfo": {
    "hearAbout": "Instagram",
    "attendedBefore": "no"
  },
  "couponCode": "SAVE10",
  "redeemCode": null,
  "referralCode": "REF-SARAH"
}
```

> **Note:** The `attendees` array keys must match the `key` values from `/form-config` steps. The core fields (`name`, `email`, `phone`) are always required. All other fields are optional and correspond to enabled fields in form-config steps. For steps with `repeatPerAttendee: true`, include data per attendee. For steps with `repeatPerAttendee: false`, include data in `additionalInfo`.

**Response (paid order - Cashfree):**
```json
{
  "orderId": "ORD-001",
  "gateway": "cashfree",
  "paymentMethod": "Cashfree",
  "cfOrderId": "cf_abc123",
  "paymentSessionId": "session_xyz...",
  "cashfreeMode": "sandbox",
  "amount": 719,
  "currency": "INR",
  "baseAmount": 699,
  "netAmount": 699,
  "bookingChargePercent": 2,
  "bookingChargeAmount": 20
}
```

**Response (paid order - Razorpay):**
```json
{
  "orderId": "ORD-001",
  "gateway": "razorpay",
  "paymentMethod": "Razorpay",
  "rzpOrderId": "order_Q1AbCdEfGh",
  "razorpayOrderId": "order_Q1AbCdEfGh",
  "razorpayKeyId": "rzp_test_123456789",
  "amount": 719,
  "amountInSubunits": 71900,
  "currency": "INR",
  "baseAmount": 699,
  "netAmount": 699,
  "bookingChargePercent": 2,
  "bookingChargeAmount": 20
}
```

**Response (manual UPI):**
```json
{
  "manual": true,
  "orderId": "ORD-001",
  "amount": 719,
  "currency": "INR",
  "upiId": "event@upi",
  "upiPaymentUrl": "upi://pay?...",
  "paymentNote": "Order ORD-001 | Early Bird x1",
  "manualUtr": null,
  "paymentProofSubmitted": false,
  "message": "Payment pending admin confirmation"
}
```

**Response (free order - total is 0):**
```json
{
  "success": true,
  "free": true,
  "orderId": "ORD-002",
  "passes": [
    {
      "id": "A7K2-M9P4",
      "passType": "Early Bird",
      "buyerName": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "status": "Valid",
      "ticketId": "A7K2-M9P4",
      "price": 0,
      "purchaseDate": "2025-03-10T14:30:00.000Z"
    }
  ]
}
```

**Payment Flow (online gateways):**
1. Call `/bookings/create-order`.
2. If response has `gateway: "cashfree"`, open Cashfree checkout with `paymentSessionId`.
3. If response has `gateway: "razorpay"`, open Razorpay checkout with `razorpayKeyId` and `rzpOrderId`.
4. After gateway success, call `/bookings/verify-payment`.
5. If response has `manual: true`, redirect to `/order/:orderId` and let the buyer submit UTR / proof.

### POST `/bookings/verify-payment`

Verify payment and generate passes.

**Request (Cashfree):**
```json
{
  "orderId": "ORD-001",
  "attendees": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "age": 21,
      "gender": "Male",
      "college": "IIT Hyderabad",
      "musicPreferences": ["EDM", "Techno"]
    }
  ],
  "additionalInfo": {
    "hearAbout": "Instagram",
    "attendedBefore": "no"
  }
}
```

**Request (Razorpay):**
```json
{
  "orderId": "ORD-001",
  "attendees": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210"
    }
  ],
  "additionalInfo": {
    "hearAbout": "Instagram",
    "attendedBefore": "no"
  },
  "razorpayPaymentId": "pay_Q1AbCdEfGh",
  "razorpayOrderId": "order_Q1AbCdEfGh",
  "razorpaySignature": "generated_signature_here"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORD-001",
  "cfPaymentId": "12345",
  "rzpPaymentId": null,
  "paymentId": "12345",
  "passes": [
    {
      "id": "A7K2-M9P4",
      "passType": "Early Bird",
      "buyerName": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "status": "Valid",
      "ticketId": "A7K2-M9P4",
      "price": 719,
      "purchaseDate": "2025-03-10T14:30:00.000Z",
      "attendeeAge": 21,
      "attendeeGender": "Male",
      "attendeeCollege": "IIT Hyderabad",
      "attendeeMusicPreferences": ["EDM", "Techno"]
    }
  ]
}
```

### POST `/bookings/manual-proof`

Submit manual UPI proof for a pending manual order.

**Request:**
```json
{
  "orderId": "ORD-001",
  "manualUtr": "123456789012",
  "paymentProofDataUrl": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORD-001"
}
```

### GET `/bookings/order/:orderId`

Returns a sanitized order for the logged-in buyer only. It is the source of truth for the secure order-status page, online-payment retries, manual UPI instructions, and failure reasons.

**Response:**
```json
{
  "orderId": "ORD-001",
  "paymentStatus": "Pending",
  "paymentMethod": "Cashfree",
  "eventName": "Event Name",
  "gateway": "cashfree",
  "passType": "Early Bird",
  "quantity": 2,
  "amount": 1598,
  "currency": "INR",
  "bookingChargePercent": 2,
  "bookingChargeAmount": 32,
  "attendees": [{ "name": "John", "email": "..." }],
  "additionalInfo": { "hearAbout": "Instagram" },
  "manual": false,
  "manualUpiId": null,
  "manualPaymentNote": null,
  "manualProofSubmitted": false,
  "paymentFailureReason": null,
  "adminReviewNote": null,
  "upiPaymentUrl": null,
  "cfOrderId": "cf_abc123",
  "cfPaymentId": null,
  "paymentSessionId": "session_xyz...",
  "cashfreeMode": "sandbox",
  "rzpOrderId": null,
  "rzpPaymentId": null,
  "razorpayKeyId": null
}
```

**Frontend Usage:**
- Show the secure order-status link `/order/:orderId` after order creation.
- For Cashfree, resume checkout with `paymentSessionId`.
- For Razorpay, resume checkout with `razorpayKeyId` + `rzpOrderId`.
- For manual UPI, re-open the instructions and allow proof submission through `/bookings/manual-proof`.
- Use `paymentFailureReason` and `adminReviewNote` to explain failed or rejected orders.
- Never expose this link publicly; it requires auth and only returns the buyer's own order.

---

## 6. Coupon / Redeem / Referral Validation

**No authentication required.**

### POST `/coupons/validate`

**Request:**
```json
{
  "code": "SAVE10",
  "cartAmount": 1598
}
```

**Response (valid):**
```json
{
  "valid": true,
  "discountPercent": 10,
  "discount": 160,
  "coupon": {
    "code": "SAVE10",
    "discountPercent": 10,
    "maxDiscount": 200,
    "minCartAmount": 500
  }
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "Invalid or expired coupon code"
}
```

### POST `/redeem-codes/validate`

**Request:**
```json
{
  "code": "FREE2024"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "passType": "Early Bird",
  "freePassCount": 2,
  "redeem": { "code": "FREE2024", "passType": "Early Bird", "freePassCount": 2 }
}
```

### POST `/referrals/validate`

**Request:**
```json
{
  "code": "REF-SARAH"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "referral": { "code": "REF-SARAH", "ownerName": "Sarah" }
}
```

---

## 7. My Passes (Dashboard)

**Requires `Authorization: Bearer <token>`**

### GET `/bookings/my`

Returns all passes belonging to the logged-in user.

**Response:**
```json
[
  {
    "id": "A7K2-M9P4",
    "passType": "Early Bird",
    "buyerName": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "status": "Valid",
    "entryTime": null,
    "exitTime": null,
    "purchaseDate": "2025-03-10T14:30:00.000Z",
    "userId": "USR-001",
    "orderId": "ORD-001",
    "couponUsed": "SAVE10",
    "redeemUsed": null,
    "referralUsed": "REF-SARAH",
    "ticketId": "A7K2-M9P4",
    "price": 719,
    "buyerEmail": "john@example.com",
    "attendeeAge": 21,
    "attendeeGender": "Male",
    "attendeeCollege": "IIT Hyderabad",
    "attendeeInstagram": "@johndoe",
    "attendeeMusicPreferences": ["EDM", "Techno"],
    "attendeeFoodPreference": "Non-Veg",
    "attendeeContentPreference": "Music",
    "attendeeSexuality": "Prefer not to say"
  }
]
```

**Frontend Usage:**
- `status`:
  - `"Valid"` → Active pass (show QR code with `id` or `ticketId`)
  - `"Inside"` → Currently at venue (show entry time)
  - `"Used"` → Already used & exited
- `ticketId` → Display as the pass code (format: XXXX-XXXX)
- Use settings `showVenueMap` to decide whether to show venue map
- Use settings `showStatistics` to show/hide stats

---

## 8. Complete Flow Example

Here's the full buy-pass flow a frontend should implement:

### Step 1: Load Event Configuration
```
GET /settings → event info, branding, rules
GET /form-config → form field definitions
GET /pass-types → available tiers
```

### Step 2: Render the Buy Page
- Use `settings` to set colors, event name, venue info
- Use `form-config` to dynamically render the attendee form
- Use `pass-types` to show available tiers with prices

### Step 3: User Registers/Logs In
```
POST /auth/register (or POST /auth/login)
→ Store the returned token
```

### Step 4: User Fills Form & Selects Pass Type
- Validate fields based on `form-config` rules (`required`, `validation`)
- Allow quantity selection (max from `settings.maxPassesPerBooking`)
- Optionally validate coupon/redeem/referral codes

### Step 5: Create Order
```
POST /bookings/create-order
Headers: { Authorization: Bearer <token> }
Body: { tierName, attendees, additionalInfo, couponCode?, redeemCode?, referralCode? }
```

### Step 6a: If Free Order
- Response includes `free: true` and `passes` array
- Show success + pass details immediately

### Step 6b: If Paid Order
- Response includes `paymentSessionId`
- Open Cashfree checkout with the session ID
- On payment success callback:
```
POST /bookings/verify-payment
Body: { orderId, attendees, additionalInfo }
→ Returns generated passes array
```

### Step 7: Show Success
- Display generated passes with QR codes
- Show venue map if `settings.showVenueMap` is true
- Link to My Passes dashboard

### Step 8: My Passes Dashboard
```
GET /bookings/my
→ Display all user's passes with status, QR codes, venue info
```

---

## 9. Data Models Reference

### Pass Status Values
| Status | Meaning |
|--------|---------|
| `Valid` | Pass purchased, not yet used |
| `Inside` | Attendee currently inside venue |
| `Used` | Attendee has entered and exited |

### Pass Type Status Values
| Status | Meaning |
|--------|---------|
| `Opening Soon` | Not yet available for purchase |
| `On Sale` | Available for purchase |
| `Sold Out` | All passes sold |
| `Ended` | Sales period over |

### Event Status Values
| Status | Meaning |
|--------|---------|
| `upcoming` | Event hasn't started yet |
| `live` | Event is happening now |
| `ended` | Event is over |
| `cancelled` | Event was cancelled |

### Form Field Types
| Type | Renders As |
|------|-----------|
| `text` | Text input |
| `email` | Email input |
| `phone` | Phone input (tel) |
| `number` | Number input (with min/max) |
| `select` | Dropdown (single choice from options) |
| `multiselect` | Multi-choice (checkboxes/chips from options) |
| `textarea` | Multi-line text |
| `checkbox` | Single checkbox |
| `radio` | Radio button group (from options) |

### Payment Gateways
| Value | Gateway |
|-------|---------|
| `cashfree` | Cashfree Payments |
| `razorpay` | Razorpay |
| `none` | No payment (free events only) |

---

## 10. Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Description of what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (token valid but no permission) |
| `404` | Not found |
| `429` | Rate limited (too many requests) |
| `500` | Server error |

### Rate Limits
- **Auth endpoints** (`/auth/register`, `/auth/login`): 30 requests per 15 minutes
- **All other API endpoints**: 120 requests per minute

---

## Quick Reference: Public vs Authenticated Endpoints

| Endpoint | Auth Required? |
|----------|---------------|
| `GET /settings` | No |
| `GET /form-config` | No |
| `GET /pass-types` | No |
| `POST /coupons/validate` | No |
| `POST /redeem-codes/validate` | No |
| `POST /referrals/validate` | No |
| `POST /auth/register` | No |
| `POST /auth/login` | No |
| `GET /auth/me` | Yes (Bearer) |
| `POST /bookings/create-order` | Yes (Bearer) |
| `POST /bookings/verify-payment` | Yes (Bearer) |
| `GET /bookings/order/:orderId` | Yes (Bearer) |
| `GET /bookings/my` | Yes (Bearer) |
