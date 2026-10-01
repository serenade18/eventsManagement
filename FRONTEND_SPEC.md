# HostMe Frontend: Specification

The complete specification for the HostMe web frontend: what it does, how it
is structured, every page, the exact API contract with the backend, the ticket
purchase flow, and how it is tested and deployed.

- **Backend:** [serenade18/hostmeBackend](https://github.com/serenade18/hostmeBackend)
  (Django REST API). Its `docs/ARCHITECTURE.md` describes the server side.
- **Status:** this repository has no code yet. This document defines what to build.
- Every request and response example below was captured from the real backend.

---

## Contents

1. [Product overview](#1-product-overview)
2. [Users and roles](#2-users-and-roles)
3. [Tech stack](#3-tech-stack)
4. [Project structure](#4-project-structure)
5. [Configuration](#5-configuration)
6. [Routes](#6-routes)
7. [Pages](#7-pages)
8. [API client](#8-api-client)
9. [API reference](#9-api-reference)
10. [Ticket purchase flow](#10-ticket-purchase-flow)
11. [Data types](#11-data-types)
12. [Formatting rules](#12-formatting-rules)
13. [Forms and validation](#13-forms-and-validation)
14. [UI and UX standards](#14-ui-and-ux-standards)
15. [Security](#15-security)
16. [Testing](#16-testing)
17. [Build and deployment](#17-build-and-deployment)
18. [Backend gaps and workarounds](#18-backend-gaps-and-workarounds)
19. [Delivery plan and acceptance checklist](#19-delivery-plan-and-acceptance-checklist)

---

## 1. Product overview

HostMe is an event ticketing platform for the Kenyan market.

- **Organizers** create events with ticket tiers (e.g. Regular, VIP), upload a
  poster, and track sales on a dashboard.
- **Buyers** browse events and buy tickets **without creating an account**.
  Free tickets are issued instantly; paid tickets are paid with **M-Pesa**
  (an STK push prompt on the buyer's phone).
- Buyers receive their tickets by **SMS** (and **email** if given). Each ticket
  has a **QR code** shown at the gate.

The frontend has two halves:

| Area | Audience | Auth |
|---|---|---|
| **Public site** | Buyers | None |
| **Organizer console** | Organizers, sponsors, admins | JWT |

## 2. Users and roles

| Role | `user_type` | Can |
|---|---|---|
| Buyer | (no account) | Browse events, buy tickets, view/download tickets, check an order |
| Organizer | `organizer` | Everything a buyer can, plus manage **own** events and ticket tiers, see **own** tickets and dashboard |
| Sponsor | `sponsor` | Log in and manage profile. The backend gives sponsors no dedicated features yet (see [§18](#18-backend-gaps-and-workarounds)). |
| Admin | `admin` | Everything organizers can, across **all** events and tickets, plus list users |

The role comes from `GET /api/userinfo/` (`user_type`); the JWT only carries
the user id.

## 3. Tech stack

The API contract is framework-agnostic. The recommended stack:

| Concern | Choice | Why |
|---|---|---|
| Framework | **Vue 3** (Composition API) + **TypeScript** | Small, fast, approachable; TS catches API-shape mistakes |
| Build tool | **Vite** | Fast dev server and builds |
| Routing | **Vue Router 4** | Route guards for the console |
| State | **Pinia** | Auth session, cached events |
| Data fetching | **Axios** + a thin typed API layer (§8) | Interceptors for auth and errors |
| Styling | **Tailwind CSS** | Consistent spacing/colour tokens, responsive utilities |
| Forms | **VeeValidate** + **Zod** | Schema validation mirroring the backend rules |
| Charts | **Chart.js** via `vue-chartjs` | Dashboard revenue/ticket charts |
| Dates | **date-fns** + `date-fns-tz` | Formatting in `Africa/Nairobi` |
| Unit tests | **Vitest** + Vue Test Utils | |
| API mocking | **MSW** (Mock Service Worker) | Same mocks in tests and local dev |
| E2E tests | **Playwright** | |
| Lint/format | ESLint + Prettier | |

> The dev server must run on **port 8080**: the backend's default `SITE_URL`
> and CORS settings point to `http://localhost:8080`, and ticket links in
> SMS/email use `SITE_URL`.

## 4. Project structure

```
src/
  main.ts
  App.vue
  router/
    index.ts              route table + guards
  api/
    client.ts             axios instance, auth + error interceptors
    errors.ts             ApiError + normalizeError()
    auth.ts               login, refresh, register, userinfo, change password
    events.ts             public + organizer event endpoints
    tickets.ts            purchase, ticket lookup, ticket list
    orders.ts             order lookup
    payments.ts           check_status
    dashboard.ts
    types.ts              all response/request types (§11)
  stores/
    auth.ts               tokens, current user, role helpers
    checkout.ts           in-progress purchase (persisted)
  composables/
    usePolling.ts         poll-until-done with backoff
    useMoney.ts, useDates.ts
  components/
    ui/                   Button, Input, Select, Modal, Toast, Badge, Spinner, EmptyState, ...
    events/               EventCard, EventGrid, EventFilters, TicketTierList, PosterUpload, TierEditor
    checkout/             QuantityPicker, BuyerForm, PhoneInput, PaymentWaiting, OrderSummary
    tickets/              TicketCard, QrCode, TicketActions
    dashboard/            StatTile, RevenueChart, TopEventsTable
    layout/               PublicLayout, ConsoleLayout, NavBar, SideNav, Footer
  pages/
    public/               HomePage, EventsPage, EventDetailPage, CheckoutPage,
                          PaymentPage, OrderPage, TicketPage, FindTicketPage
    auth/                 LoginPage, RegisterPage
    console/              DashboardPage, MyEventsPage, EventFormPage,
                          ConsoleEventPage, TicketsPage, ProfilePage, PasswordPage
    admin/                UsersPage
    NotFoundPage.vue
  mocks/                  MSW handlers + fixtures (from §9 examples)
  styles/
tests/
  unit/  e2e/
```

## 5. Configuration

Environment variables (Vite exposes only `VITE_*`):

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Backend API root (no trailing slash) |
| `VITE_SUPPORT_CONTACT` | `support@hostme.co.ke` | Shown on payment problems / refunds |
| `VITE_USE_MOCKS` | `false` | `true` starts MSW so the UI runs without a backend |

Provide `.env.example` with these. **No secrets belong in the frontend**; every
`VITE_*` value is public in the built bundle.

## 6. Routes

### Public

| Path | Page | Notes |
|---|---|---|
| `/` | Home | Featured + upcoming events |
| `/events` | Events | Browse, search, filter |
| `/events/:id` | Event detail | Tiers + buy |
| `/events/:id/checkout?tier=:ticketTypeId` | Checkout | Quantity + buyer details |
| `/orders/:reference/pay` | Payment waiting | Polls until paid / failed / expired |
| `/orders/:reference` | Order confirmation | Order + all its tickets |
| `/tickets/:ticketNumber` | Ticket | Single ticket with QR |
| `/tickets/:ticketNumber/download` | Ticket (download) | **Required**: this exact URL is sent in SMS and email. Same page as above, with download emphasised. |
| `/find-ticket` | Find my ticket | Look up by ticket number / order reference |
| `/login`, `/register` | Auth | Redirect to `/console` if already logged in |

### Organizer console (requires login)

| Path | Page | Roles |
|---|---|---|
| `/console` | Dashboard | organizer, admin |
| `/console/events` | My events (admins: all events) | organizer, admin |
| `/console/events/new` | Create event | organizer, admin |
| `/console/events/:id` | Event overview (tiers, sales, attendees) | owner, admin |
| `/console/events/:id/edit` | Edit event | owner, admin |
| `/console/tickets` | Tickets sold | organizer, admin |
| `/console/profile` | Profile | all logged in |
| `/console/password` | Change password | all logged in |
| `/console/users` | Users | admin |

Sponsors land on `/console/profile` (no dashboard data for them yet).

### Guards

- Console routes: no token → redirect to `/login?next=<path>`.
- After login, fetch `/userinfo/` once and keep it in the auth store; role
  checks use `user_type`. Wrong role → `/console` (or `/console/profile` for sponsors).
- Unknown path → Not found page.

## 7. Pages

Every page that loads data must have **loading**, **empty** and **error**
states (§14).

### 7.1 Home `/`

- Hero with call to action ("Browse events").
- **Featured events**: `is_feature === true`, upcoming only.
- **Upcoming events**: events with `date >= today`, soonest first, max 8, "See all" → `/events`.
- Data: `GET /all-events/` (returns all events, newest date first; sort client-side).

### 7.2 Events `/events`

- Grid of `EventCard`: poster (fallback image when `poster` is `null`), title,
  date + time, venue, category chip, **"From KES X"** (lowest tier price) or
  **"Free"**.
- Filters (client-side; the API has no query parameters or pagination):
  search (title, venue, category), category (derived from loaded events),
  date (upcoming / this week / this month / past), price (free / paid).
- Default: upcoming only, soonest first. Keep filters in the query string so
  links are shareable.

### 7.3 Event detail `/events/:id`

- Poster, title, category, date and time (Nairobi), venue, description,
  organizer name, sponsors (if any).
- **Ticket tiers** (`ticket_types`): name, description, price, and a sale
  state from `sales_start` / `sales_end`:
  - before `sales_start` → "On sale from <date>", buy disabled
  - after `sales_end` → "Sales closed", buy disabled
  - otherwise → **Buy** button → `/events/:id/checkout?tier=<id>`
- Past events (date before today): show "This event has ended", no buying.
- Data: `GET /all-events/:id/`.
- The API does not return remaining stock; "sold out" is only known when a
  purchase is refused (§18).

### 7.4 Checkout `/events/:id/checkout?tier=:id`

- Order summary: event, tier, unit price, quantity (1–10), **total**.
- Buyer form: full name (required), phone (required, Kenyan), email (optional,
  recommended: "We'll email your tickets").
- Submit → `POST /tickets/` (§10). Disable the button while submitting; never
  submit twice.
- Results:
  - **201, free** → go to `/orders/:reference` (reference = `order.reference`).
  - **200, paid** → save the pending purchase (§10.4) and go to `/orders/:reference/pay`.
  - **400** → show the message (e.g. "Tickets for this type are sold out",
    "Ticket sales for this type have ended") or field errors.

### 7.5 Payment waiting `/orders/:reference/pay`

- Big phone illustration: "Check your phone. Enter your M-Pesa PIN to pay
  **KES 3,000**."
- Countdown to `expires_at` ("Your tickets are held for 9:42").
- Polls `GET /orders/:reference/` (§10.3) and reacts to `status`:

| `status` | UI |
|---|---|
| `pending` | Keep waiting. After 90 s, also show "Didn't get the prompt?" with **Try again** (starts a new purchase) |
| `paid` | Success animation → `/orders/:reference` |
| `failed` | "Payment was cancelled or failed." **Try again** → back to checkout with the same tier, quantity and buyer details prefilled |
| `expired` | "Your reservation timed out." **Start again**. Keep polling slowly for 2 more minutes, since a late payment can still be honoured |
| `refund_required` | "We received your payment but couldn't issue tickets. Contact support with reference **XXXX**; you will be refunded." |

### 7.6 Order confirmation `/orders/:reference`

- "You're going!" header, event summary, order reference, total paid.
- One `TicketCard` per ticket (QR, ticket number, tier), each linking to
  `/tickets/:ticketNumber`.
- "Tickets sent by SMS to 07XX…678" (and email if provided).
- QR images are generated in the background and can be `null` for a few
  seconds; poll the order every 2 s (max ~30 s) until every ticket has
  `qr_code`, showing a placeholder meanwhile.
- If the order is not `paid`, send the user to `/orders/:reference/pay`.

### 7.7 Ticket `/tickets/:ticketNumber` and `/tickets/:ticketNumber/download`

- Data: `GET /tickets/:ticketNumber/`.
- Ticket card: event name, tier, buyer name, ticket number, purchase date, QR.
- Actions: **Download QR (PNG)**, **Print**, **Add to calendar (.ics)** (built client-side).
- **The QR PNG is white on a transparent background** (backend setting).
  Always render it on a dark background (e.g. `bg-slate-900` with padding) or
  it is invisible; the print stylesheet must keep that dark box (§18).
- Not found: the API answers **400** with `details: "No Ticket matches the
  given query."` Show "We couldn't find that ticket" with a link to `/find-ticket`.
- Print stylesheet: hide navigation; one ticket per page.

### 7.8 Find my ticket `/find-ticket`

- One input: "Ticket number or order reference" (12 hex characters, optionally
  `-N`).
- Try `GET /orders/:value/` first (works for order references); on 404 try
  `GET /tickets/:value/`; route to the matching page.

### 7.9 Login `/login`

- Email + password → `POST /gettoken/`, then `GET /userinfo/`.
- 401 → "Email or password is incorrect".
- Honour `?next=`.

### 7.10 Register `/register`

- Fields: name, email, phone, organization (optional), password + confirm,
  account type: **Organizer** or **Sponsor**. Never offer `admin` (§18).
- `POST /users/` → 201 → auto-login with the same credentials → `/console`.
- Errors are a field map (`{"email": ["..."]}`); show them under the fields.

### 7.11 Dashboard `/console`

- Data: `GET /dashboard/`.
- Stat tiles: **Tickets sold**, **Revenue**, **Platform fee (10%)**, **Net revenue**,
  **Events**, **Active events**.
- **Revenue and tickets by month**: bar (tickets) + line (revenue) from
  `monthlyData` (month labels like `"Oct"`).
- **Recent events** table (`topEvents`: latest 5 events): name, tickets,
  revenue, status badge.
- `demographics` is **placeholder data** from the backend. Hide it (or label it
  "Sample data") until it's real.
- Quick actions: "Create event", "View tickets".

### 7.12 My events `/console/events`

- Data: `GET /events/` (organizers: own events; admins: all).
- Table/cards: poster thumb, title, date, venue, tiers count, open/closed badge
  (`is_open`), featured badge; actions: view, edit, delete.
- Tabs: Upcoming / Past. Search by title.
- Delete → confirm modal → `DELETE /events/:id/`. A 400 means it has orders
  ("Events that already have ticket orders cannot be deleted"); show it.

### 7.13 Create / edit event `/console/events/new`, `/console/events/:id/edit`

- Fields: title, category (select with common values + free text), description
  (multi-line), venue, date, time, poster upload (preview, JPG/PNG/WebP,
  ≤ 5 MB client limit), toggles: **On sale** (`is_open`), **Free event**
  (`is_free`), **Featured** (`is_feature`, admins only in the UI).
- **Ticket tiers editor** (repeatable rows): name, description, price (KES,
  0 = free), quantity, sales start, sales end. At least one tier.
- Sent as **multipart/form-data** (§9.3). Tiers go in one field, `ticket_type`,
  as a JSON string.
- Edit (`PUT`, partial): sending `ticket_type` **replaces all tiers**. Once
  any tier has orders the backend refuses (400 "Ticket types that already have
  orders cannot be replaced"). So:
  - Before sales: tiers editable.
  - After the first order: lock the tier editor (read-only) with an
    explanation, and **omit** `ticket_type` from the request so other fields
    can still be edited.
- On success → `/console/events/:id`.

### 7.14 Event overview `/console/events/:id`

- Event header + edit button, public link (`/events/:id`) with copy button.
- Per tier: price, capacity, sold (count of that tier's tickets), revenue.
- **Attendees** table: ticket number, buyer name, phone, email, tier,
  purchase date; CSV export (client-side).
- Data: `GET /events/:id/` and `GET /tickets/` filtered client-side by
  `ticket_type_details.event === id`.

### 7.15 Tickets `/console/tickets`

- All tickets for the organizer's events (admins: all), newest first.
- Columns: ticket number, event, tier, buyer, phone, purchase date. Search,
  filter by event, CSV export.
- Data: `GET /tickets/` (no pagination; filter client-side).

### 7.16 Profile `/console/profile`, Password `/console/password`

- Profile: name, phone, organization, country, city, bio; email read-only.
  `PATCH /userinfo/`.
- Delete account (danger zone, typed confirmation) → `DELETE /userinfo/` → log out.
- Password: current, new, confirm → `POST /userinfo/change-password/`.

### 7.17 Users `/console/users` (admin)

- `GET /users/`: table of name, email, phone, role, joined. Search, filter by role.

## 8. API client

### 8.1 Base

- `baseURL = import.meta.env.VITE_API_BASE_URL`.
- JSON by default; multipart for event create/update.
- **All paths end with a trailing slash** (`/events/`, `/events/1/`). Django
  redirects or 404s without it.

### 8.2 Authentication

- `POST /gettoken/ {email, password}` → `{access, refresh}`.
- Send `Authorization: Bearer <access>` on console requests.
- Lifetimes: **access 3 days, refresh 4 days**. Refresh does **not** rotate:
  `POST /refresh_token/ {refresh}` returns only a new `access`.
- Interceptor: on **401** from a console request, try one refresh (single
  in-flight refresh shared by concurrent requests), retry the request; if the
  refresh fails → clear the session → `/login?next=…`.
- Logout: client-side only (discard tokens); the backend has no logout endpoint.
- Never send the token to public endpoints (purchase, ticket, order lookups):
  a stale token makes public endpoints return 401.

### 8.3 Error normalization

The backend returns several error shapes. Normalize every failure into one
type before it reaches components:

```ts
export interface ApiError {
  status: number                   // HTTP status (0 = network)
  message: string                  // human-readable, ready to show
  fieldErrors: Record<string, string[]>
}
```

| Shape returned | Where | Normalize to |
|---|---|---|
| `{"error": true, "message": "...", "errors": {field: [..]}}` | events, tickets | `message`, `fieldErrors = errors` |
| `{"error": true, "message": "...", "details": "..."}` | lists, ticket lookup | `message` (log `details`) |
| `{"field": ["..."]}` | register, profile update | `message = "Please fix the highlighted fields"`, `fieldErrors` |
| `{"error": "..."}` | change password | `message` |
| `{"detail": "..."}` | auth failures, 404 | `message = detail` |
| non-JSON / network error | anywhere | `message = "Something went wrong. Check your connection and try again."` |

Success responses also vary: most are wrapped in
`{"error": false, "message", "data"}`, but `/userinfo/`, `/users/:id/`,
`/gettoken/` and `/dashboard/` are not. Unwrap per endpoint in the API layer
so components only see typed data.

## 9. API reference

Base: `${VITE_API_BASE_URL}` (e.g. `http://localhost:8000/api`). 🔓 = public,
🔒 = requires a token.

### 9.1 Auth and account

**Login** 🔓 `POST /gettoken/`
```json
// request
{"email": "org@ex.com", "password": "Str0ng-pass!"}
// 200
{"refresh": "eyJ…", "access": "eyJ…"}
// 401
{"detail": "No active account found with the given credentials"}
```

**Refresh** 🔓 `POST /refresh_token/`: `{"refresh": "…"}` → `{"access": "…"}`

**Register** 🔓 `POST /users/`
```json
// request
{"email": "org@ex.com", "name": "Org Name", "phone": "0700000000",
 "user_type": "organizer", "password": "Str0ng-pass!"}
// 201
{"message": "User account created successfully"}
// 400
{"email": ["Enter a valid email address."], "password": ["This field is required."]}
```

**Current user** 🔒 `GET /userinfo/` (also `PATCH`/`PUT` with the same fields, `DELETE` → 204)
```json
{"id": 1, "email": "org@ex.com", "name": "Org Name", "phone": "0700000000",
 "country": null, "organization": null, "city": null, "bio": null,
 "user_type": "organizer", "added_on": "2026-10-01T12:43:50.370215Z"}
```

**Change password** 🔒 `POST /userinfo/change-password/`
```json
{"current_password": "…", "new_password": "…"}
// 200 {"message": "Password updated successfully"}
// 400 {"error": "Current password is incorrect"}
```

**Users** 🔒 admin `GET /users/` → `{"error": false, "message": "All Users List Data", "data": [User…]}`

### 9.2 Public events

**List** 🔓 `GET /all-events/` → `{"error": false, "message": "All Events List Data", "data": [Event…]}`

**Detail** 🔓 `GET /all-events/:id/` → `{"error": false, "message": "Single Data Fetch", "data": Event}`

```json
// Event
{
  "id": 1,
  "title": "Jazz Night",
  "category": "Music",
  "poster": "http://localhost:8000/media/posters/jazz.jpg",   // or null
  "description": "Live jazz",
  "venue": "KICC",
  "date": "2026-12-12",
  "time": "19:00:00",
  "is_feature": false,
  "is_free": false,
  "is_open": true,
  "added_on": "2026-10-01T12:43:51.284542Z",
  "sponsors": [],                                             // user ids
  "organizer": {"id": 1, "email": "org@ex.com", "name": "Org Name", "phone": "0700000000",
                "country": null, "organization": null, "city": null, "bio": null,
                "user_type": "organizer", "last_login": null},
  "ticket_types": [
    {"id": 1, "event": 1, "name": "Regular", "description": "GA", "price": "0.00",
     "quantity": 100, "sales_start": "2026-09-30T12:43:51Z", "sales_end": "2026-10-11T12:43:51Z",
     "created_at": "…", "updated_at": "…"},
    {"id": 2, "event": 1, "name": "VIP", "description": "Front", "price": "1500.00",
     "quantity": 2, "sales_start": "…", "sales_end": "…", "created_at": "…", "updated_at": "…"}
  ]
}
```

> The public event payload includes the organizer's **email and phone**. Don't
> display them on the public site (§18).

### 9.3 Organizer events 🔒

| Method | Path | Notes |
|---|---|---|
| GET | `/events/` | Own events (admins: all), same `Event` shape |
| GET | `/events/:id/` | `{"error", "message", "data": Event}` |
| POST | `/events/` | multipart, see below → 201 `{"error": false, "message": "Event created successfully"}` (no id returned, §18) |
| PUT | `/events/:id/` | multipart, **partial** update → 200 `{"error": false, "message": "Event updated successfully"}` |
| DELETE | `/events/:id/` | 200 `{"error": false, "message": "Event deleted successfully"}`; 400 if it has orders |

`PATCH` is **not** supported; use `PUT` (it already behaves as a partial update).

Multipart fields for create / update:

| Field | Format |
|---|---|
| `title`, `category`, `description`, `venue` | text (required on create) |
| `date` | `YYYY-MM-DD` |
| `time` | `HH:MM` |
| `poster` | file (optional) |
| `is_open`, `is_free`, `is_feature` | `"true"` / `"false"` |
| `sponsors` | repeat the field once per user id (optional) |
| `ticket_type` | JSON string: `[{"name","description","price","quantity","sales_start","sales_end"}]`, datetimes ISO 8601 with timezone |

```js
const fd = new FormData()
fd.append('title', 'Jazz Night')
fd.append('category', 'Music')
fd.append('description', 'Live jazz')
fd.append('venue', 'KICC')
fd.append('date', '2026-12-12')
fd.append('time', '19:00')
fd.append('is_open', 'true')
if (posterFile) fd.append('poster', posterFile)
fd.append('ticket_type', JSON.stringify([
  { name: 'Regular', description: 'GA', price: '0', quantity: 100,
    sales_start: '2026-10-01T00:00:00+03:00', sales_end: '2026-12-12T18:00:00+03:00' },
]))
```

Validation error (400):
```json
{"error": true, "message": "Validation Error",
 "errors": {"venue": ["This field is required."], "date": ["This field is required."]}}
```
Tier errors come back as `{"error": true, "message": "Ticket Type Validation Error", "errors": [ {…per tier…} ]}`
(an array aligned with the submitted tiers).

### 9.4 Buying tickets 🔓

**Purchase** `POST /tickets/`
```json
// request
{"ticket_type": 2, "quantity": 2, "buyer_name": "Jane Doe",
 "buyer_phone": "0712345678", "buyer_email": "jane@ex.com"}
```

Free tier → **201**:
```json
{"error": false, "message": "Free ticket issued successfully",
 "data": Ticket,           // the first ticket
 "order": Order}           // includes all tickets
```

Paid tier → **200** (STK push sent; nothing issued yet):
```json
{"error": false,
 "message": "Hey Jane! STK Push sent, complete payment on your phone.",
 "data": {"ticket_number": "2be2b6c7f346", "order_reference": "2be2b6c7f346",
          "checkout_request_id": "ws_CO_123", "amount": 3000.0,
          "expires_at": "2026-10-01T12:53:51.481903Z"}}
```

Errors → **400**:
```json
{"error": true, "message": "Tickets for this type are sold out"}
{"error": true, "message": "Ticket sales for this type have ended"}
{"error": true, "message": "Ticket sales for this type have not started yet"}
{"error": true, "message": "Quantity must be between 1 and 10"}
{"error": true, "message": "Failed to initiate payment", "data": {…daraja response…}}
{"error": true, "message": "Validation Error",
 "errors": {"buyer_name": ["This field is required."], "buyer_phone": ["This field is required."]}}
```

**Order** `GET /orders/:reference/` → `{"error": false, "message": "Order Fetch", "data": Order}`
```json
{"reference": "2be2b6c7f346", "status": "paid", "quantity": 2,
 "unit_price": "1500.00", "total_amount": "3000.00", "buyer_name": "Jane Doe",
 "expires_at": "2026-10-01T12:53:51Z", "paid_at": "2026-10-01T12:43:51Z",
 "ticket_type": 2,
 "ticket_type_details": {"id": 2, "name": "VIP", "price": "1500.00", "quantity": 2,
                         "event": 1, "event_title": "Jazz Night"},
 "tickets": [Ticket, Ticket]}     // [] until paid
```
Unknown reference → **404** `{"detail": "No Order matches the given query."}`

**Ticket** `GET /tickets/:ticketNumber/` → `{"error": false, "message": "Single Ticket Fetch", "data": TicketDetail}`
```json
{"id": 2, "ticket_number": "2be2b6c7f346",
 "qr_code": "http://localhost:8000/media/tickets/qrcodes/2be2b6c7f346.png",   // null until generated
 "purchased": true, "buyer_name": "Jane Doe", "buyer_email": null,
 "buyer_phone": "0712345678", "purchase_date": "2026-10-01T12:43:51Z",
 "ticket_type": 2,
 "ticket_type_details": {"id": 2, "event": 1, "name": "VIP", "description": "Front",
                         "price": "1500.00", "quantity": 2, "sales_start": "…", "sales_end": "…",
                         "created_at": "…", "updated_at": "…", "event_name": "Jazz Night"}}
```
Unknown ticket → **400** (not 404): `{"error": true, "message": "Error fetching ticket", "details": "No Ticket matches the given query."}`

Ticket numbers: the first ticket of an order equals the order reference
(`2be2b6c7f346`); further tickets are `<reference>-2`, `<reference>-3`, ….

**Payment status** `GET /mpay/check_status/?checkout_request_id=ws_CO_123`
```json
{"error": false, "message": "Payment status retrieved successfully",
 "data": {"checkout_request_id": "ws_CO_123", "status": "success",   // pending | success | failed
          "order_status": "paid", "amount": 3000.0, "phone_number": "254712345678",
          "receipt": "QK1", "transaction_date": "2026-10-01T09:00:00Z",
          "ticket": {"ticket_number": "…", "event_id": 1, "buyer_name": "…", "buyer_email": null,
                     "buyer_phone": "…", "qr_code_url": "…"},
          "tickets": [ … ]}}
```
Prefer `GET /orders/:reference/` for polling; use this only if you need the
M-Pesa receipt number.

### 9.5 Organizer data 🔒

**Tickets** `GET /tickets/` → `{"error": false, "message": "All Tickets List Data", "data": [Ticket…]}` (newest first)

**Dashboard** `GET /dashboard/`
```json
{"error": false, "message": "Dashboard API",
 "overview": {"ticketsSold": 3, "revenue": 3000.0, "systemFee": 300.0, "netRevenue": 2700.0,
              "total_events": 1, "active_events": 1},
 "topEvents": [{"name": "Jazz Night", "tickets": 3, "revenue": 3000.0, "status": "Active"}],
 "monthlyData": [{"month": "Oct", "revenue": 3000.0, "tickets": 3}],
 "demographics": [{"ageGroup": "18-25", "percentage": 35, "count": 857}, …]}   // placeholder
```

## 10. Ticket purchase flow

### 10.1 Sequence

```
Buyer            Frontend                         Backend                    M-Pesa
  │ pick tier,     │                                 │                          │
  │ fill form ───▶ │ POST /tickets/ ───────────────▶ │ reserve order            │
  │                │                                 │── free? issue tickets    │
  │                │ ◀── 201 {order} ─────────────── │                          │
  │                │   → /orders/:ref                │                          │
  │                │                                 │── paid: STK push ──────▶ │
  │                │ ◀── 200 {order_reference} ───── │                          │
  │                │   → /orders/:ref/pay            │                          │ prompt
  │ enter PIN ─────┼─────────────────────────────────┼─────────────────────────▶│
  │                │ poll GET /orders/:ref/ ───────▶ │ ◀── callback (paid) ──── │
  │                │ ◀── status: paid, tickets ───── │ issue tickets, SMS/email │
  │                │   → /orders/:ref                │                          │
```

### 10.2 Order statuses

| Status | Meaning | Terminal |
|---|---|---|
| `pending` | Waiting for payment; tickets held until `expires_at` (10 min) | no |
| `paid` | Tickets issued | yes |
| `failed` | Payment cancelled / failed / STK push could not be sent; tickets released | yes |
| `expired` | Not paid in time; tickets released. A late payment can still turn it `paid` or `refund_required` | effectively |
| `refund_required` | Money received but no tickets (sold out meanwhile, or underpaid). Manual refund | yes |

### 10.3 Polling rules (`usePolling`)

- Endpoint: `GET /orders/:reference/`.
- Interval: every **3 s** for the first 2 minutes, then every **10 s** until
  `expires_at` + 2 minutes, then stop and show "Still waiting? Check your
  SMS or contact support."
- Stop immediately on `paid`, `failed`, `refund_required`.
- Pause while the tab is hidden (`visibilitychange`), resume on focus with an
  immediate fetch.
- Network errors: keep polling (with backoff), show a subtle "reconnecting"
  note; never treat a network error as a payment failure.

### 10.4 Resilience

- Persist the in-progress purchase (`reference`, `amount`, `expires_at`,
  event/tier names, buyer details without email) in `localStorage` under
  `hostme.checkout`, so a reload or closed tab can resume at
  `/orders/:reference/pay`. Clear it on a terminal status.
- Disable the submit button after the first click; on retry after `failed`,
  create a **new** order (the old one is closed).
- If a reload lands on `/orders/:reference/pay` for an order already `paid`,
  redirect to `/orders/:reference`.

### 10.5 Phone numbers

Accept `07XXXXXXXX`, `01XXXXXXXX`, `+2547…`, `2547…`, `7XXXXXXXX` and spaces.
Validate as a Kenyan mobile number; send it as typed (the backend normalizes
to `2547XXXXXXXX`). Display masked: `07XX XXX 678`.

## 11. Data types

```ts
// api/types.ts
export type UserType = 'admin' | 'organizer' | 'sponsor'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refund_required'
export type PaymentStatus = 'pending' | 'success' | 'failed'

/** Monetary values from serializers are strings ("1500.00"); computed ones are numbers. */
export type Money = string | number

export interface User {
  id: number
  email: string
  name: string
  phone: string
  user_type: UserType
  organization: string | null
  country: string | null
  city: string | null
  bio: string | null
  added_on?: string
  last_login?: string | null
}

export interface TicketType {
  id: number
  event: number
  name: string
  description: string | null
  price: string            // "1500.00"
  quantity: number         // capacity, not remaining
  sales_start: string      // ISO datetime, UTC
  sales_end: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: number
  title: string
  category: string
  poster: string | null    // absolute URL
  description: string
  venue: string
  date: string             // "YYYY-MM-DD"
  time: string             // "HH:MM:SS"
  is_feature: boolean
  is_free: boolean
  is_open: boolean
  added_on: string
  sponsors: number[]
  organizer: User
  ticket_types: TicketType[]
}

export interface TicketTypeMini {
  id: number; name: string; price: string; quantity: number; event: number; event_title: string
}

export interface Ticket {
  id: number
  ticket_number: string
  qr_code: string | null   // absolute URL; null until generated
  purchased: boolean
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  purchase_date: string | null
  ticket_type: number
  ticket_type_details: TicketTypeMini
}

/** GET /tickets/:number/ returns a fuller ticket_type_details. */
export interface TicketDetail extends Omit<Ticket, 'ticket_type_details'> {
  ticket_type_details: TicketType & { event_name: string }
}

export interface Order {
  reference: string
  status: OrderStatus
  quantity: number
  unit_price: string
  total_amount: string
  buyer_name: string
  expires_at: string
  paid_at: string | null
  ticket_type: number
  ticket_type_details: TicketTypeMini
  tickets: Ticket[]
}

export interface PurchaseRequest {
  ticket_type: number
  quantity: number
  buyer_name: string
  buyer_phone: string
  buyer_email?: string
}

export type PurchaseResult =
  | { kind: 'issued'; order: Order }
  | { kind: 'awaiting_payment'; reference: string; checkoutRequestId: string; amount: number; expiresAt: string }

export interface Dashboard {
  overview: {
    ticketsSold: number; revenue: number; systemFee: number; netRevenue: number
    total_events: number; active_events: number
  }
  topEvents: { name: string; tickets: number; revenue: number; status: 'Active' | 'Upcoming' }[]
  monthlyData: { month: string; revenue: number; tickets: number }[]
  demographics: { ageGroup: string; percentage: number; count: number }[]
}

export interface Envelope<T> { error: boolean; message: string; data: T }
```

## 12. Formatting rules

| What | Rule | Example |
|---|---|---|
| Money | `Number(value)` first (strings and numbers both occur), then `Intl.NumberFormat('en-KE', {style: 'currency', currency: 'KES', maximumFractionDigits: 0})`; show "Free" for 0 | `KES 1,500` |
| Dates/times | API datetimes are UTC; display in **Africa/Nairobi** | `Sat, 12 Dec 2026 · 7:00 PM` |
| Event date + time | `date` + `time` are local event values; combine without timezone conversion | `12 Dec 2026, 7:00 PM` |
| Countdown | `mm:ss` until `expires_at` | `09:42` |
| Phone | Mask middle digits on public screens | `07XX XXX 678` |
| Ticket number | Monospace, uppercase display is fine (lookups are case-sensitive: send as received) | `2BE2B6C7F346` |

## 13. Forms and validation

Mirror the backend so users see errors before submitting; always also render
server field errors.

| Form | Field | Rules |
|---|---|---|
| Register | email | required, email, ≤ 255 |
| | name | required, ≤ 255 |
| | phone | required, Kenyan phone |
| | password | required, ≥ 8 chars, not all numeric; confirm must match |
| | user_type | `organizer` \| `sponsor` |
| Login | email, password | required |
| Purchase | buyer_name | required, ≤ 255 |
| | buyer_phone | required, Kenyan mobile |
| | buyer_email | optional, email |
| | quantity | integer 1–10 |
| Event | title, category, venue | required, ≤ 255 |
| | description | required |
| | date | required; warn if in the past |
| | time | required |
| | poster | image, ≤ 5 MB (client limit) |
| Tier | name | required, ≤ 100 |
| | price | required, ≥ 0, max 2 decimals, ≤ 99,999,999.99 |
| | quantity | required, integer ≥ 1 |
| | sales_start / sales_end | required; end after start; end not after the event start |
| Profile | organization, country, city | ≤ 100 |
| Password | new_password | ≥ 8 chars, not all numeric, differs from current |

## 14. UI and UX standards

**Design tokens.** Define colours, spacing, radius and typography once
(Tailwind config). Support light and dark themes.

**Core components.** Button (primary/secondary/danger/ghost, loading state),
Input, Textarea, Select, Toggle, DateTime picker, FileUpload with preview,
Modal/ConfirmDialog, Toast, Badge (order/event statuses), Card, Table (sort,
search, empty state), Tabs, Skeleton loaders, EmptyState, ErrorState (with
retry), Pagination (client-side for long tables).

**States on every data view.**
- Loading: skeletons matching the layout (no full-page spinners).
- Empty: explanation + next action ("No events yet. Create your first event").
- Error: the normalized `ApiError.message` + **Retry**.

**Responsive.** Mobile-first; most buyers are on phones. Checkout and payment
pages must work at 360 px wide with no horizontal scroll; tap targets ≥ 44 px.

**Accessibility (WCAG 2.1 AA).** Semantic HTML, labelled inputs, visible focus,
keyboard-operable menus and modals (focus trap, Esc closes), contrast ≥ 4.5:1,
`aria-live="polite"` for payment status changes and toasts, alt text for
posters (`"<title> poster"`) and QR codes (`"QR code for ticket <number>"`).

**Performance.** Lazy-load console routes and the chart library; `loading="lazy"`
on poster images with fixed aspect ratio (no layout shift); cache the public
events list for 60 s in the store.

**SEO / sharing (public pages).** Page titles per event, Open Graph tags
(title, description, poster) on event pages.

## 15. Security

- **Tokens:** keep the access token in memory and the refresh token in
  `localStorage` (the backend issues bearer tokens, not cookies). Mitigate XSS:
  never use `v-html` with API data, set a strict Content Security Policy at the
  host.
- Don't attach the token to public requests (§8.2).
- Show only what each page needs: no organizer contact details on public
  pages; mask buyer phones on public screens.
- Treat every role check in the UI as cosmetic; the backend enforces access.
- No secrets, keys or M-Pesa credentials in frontend code or `VITE_*` vars.
- Validate uploads client-side (type/size) before sending.

## 16. Testing

**Unit (Vitest):** error normalizer (every shape in §8.3), money/date
formatters, phone validation, `usePolling` (timers mocked), purchase result
mapping, auth store (refresh queueing).

**Component:** CheckoutPage (validation, submit once, error display),
PaymentPage (each status), TierEditor (add/remove, locked mode), Ticket page
QR placeholder and dark background.

**E2E (Playwright + MSW):**
1. Browse → event → free tier → order confirmation with QR.
2. Paid tier → payment page → mock flips to `paid` → confirmation.
3. Paid tier → `failed` → retry prefilled.
4. Sold-out message on purchase.
5. `/tickets/:number/download` (SMS link) renders the ticket.
6. Register → auto-login → create event with poster and two tiers → appears in
   My events and on the public site.
7. Edit event after a sale: tiers locked, other fields save.
8. Dashboard renders stats and charts.
9. Expired token → silent refresh → request succeeds; failed refresh → login.

Mocks live in `src/mocks/` and use the payloads from §9 so tests match the real API.

## 17. Build and deployment

```bash
npm install
npm run dev        # http://localhost:8080
npm run test       # unit + component
npm run test:e2e   # Playwright
npm run build      # outputs dist/
```

- Static hosting (Netlify, Vercel, Nginx, S3 + CloudFront). Configure an
  **SPA fallback** (all unknown paths → `index.html`) so deep links like
  `/tickets/abc/download` from SMS work.
- Backend settings to match the deployed frontend: `SITE_URL=https://<frontend>`
  (used in SMS/email links) and `CORS_ALLOWED_ORIGINS=https://<frontend>`.
- CI: lint, type-check (`vue-tsc`), unit tests, build, then E2E against MSW.

## 18. Backend gaps and workarounds

Things the frontend must handle until the backend changes. Each is worth a
backend issue.

| # | Gap | Frontend workaround | Suggested backend fix |
|---|---|---|---|
| 1 | **Anyone can register as `admin`** (`user_type` is accepted from the client) | Never offer `admin` in the UI | Restrict `user_type` on registration to organizer/sponsor (**security, high priority**) |
| 2 | No remaining-stock field on ticket types | Rely on the purchase 400 "sold out" message | Add `available` to `TicketType` responses |
| 3 | QR PNG is white on transparent | Always render on a dark background, including print | Generate black-on-white QR codes |
| 4 | Unknown ticket returns 400, not 404 | Treat `details` containing "No Ticket matches" as not found | Return 404 |
| 5 | Event create doesn't return the new event or id | After 201, refetch `/events/` and pick the newest (highest `id`) | Return the created event |
| 6 | Public event payload exposes organizer email/phone | Don't render them | Use a public organizer serializer |
| 7 | Editing tiers replaces all of them; refused once orders exist | Lock tier editing after the first sale; omit `ticket_type` on edit | Per-tier create/update endpoints |
| 8 | No pagination, search or filters on lists | Filter/sort client-side; cache | Add pagination and query params |
| 9 | Organizers can't list users, so the sponsor picker has no data source | Hide sponsor selection for organizers (admins can use `/users/`) | Endpoint listing sponsors |
| 10 | Sponsors have no features | Sponsors see profile only | Define the sponsor experience |
| 11 | Dashboard `demographics` is hard-coded | Hide or label as sample | Real data or remove |
| 12 | `is_open` isn't enforced at purchase | Disable buying when `is_open` is false | Decide and enforce on the server |
| 13 | Money is sometimes a string, sometimes a number | Always `Number()` before formatting | Consistent decimal strings |
| 14 | `POST /verify/` is a broken leftover route | Don't call it | Remove the route |
| 15 | No logout/token revocation endpoint | Discard tokens client-side | Expose SimpleJWT blacklist logout |
| 16 | Media served only when backend `DEBUG=True` | n/a | Serve `/media/` via the web server or object storage in production |

## 19. Delivery plan and acceptance checklist

### Milestones

1. **Foundation**: Vite + Vue + TS project, Tailwind, router, API client with
   error normalization, auth store, MSW mocks, CI.
2. **Public browsing**: Home, Events, Event detail.
3. **Purchase**: Checkout, Payment waiting, Order confirmation, Ticket page
   (+ `/download`), Find my ticket.
4. **Auth**: Login, Register, guards, token refresh.
5. **Console**: Dashboard, My events, Create/Edit event (poster, tiers),
   Event overview with attendees, Tickets, Profile/Password.
6. **Admin**: Users; admin-only toggles.
7. **Hardening**: accessibility pass, E2E suite, performance budget, deploy.

### Definition of done

- [ ] All routes in §6 exist; `/tickets/:ticketNumber/download` works from a cold load.
- [ ] Free purchase → confirmation with visible QR codes.
- [ ] Paid purchase handles `pending`, `paid`, `failed`, `expired`, `refund_required`, and resumes after reload.
- [ ] Every data view has loading, empty and error states.
- [ ] All API errors reach users as readable messages (no raw JSON, no `[object Object]`).
- [ ] Organizer can create an event with poster and tiers, edit it, and delete it when it has no orders.
- [ ] Dashboard shows real stats; placeholder demographics hidden or labelled.
- [ ] Role-based navigation: organizer, sponsor and admin each see the right menu; no `admin` option at registration.
- [ ] Mobile (360 px) checkout and ticket pages work; QR readable on screen and in print.
- [ ] Lint, type-check, unit and E2E tests pass in CI.
