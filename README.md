# MyEvents Frontend

Web frontend for **MyEvents**, an event ticketing platform: buyers browse events
and buy tickets (free or via M-Pesa) without an account; organizers manage
events and track sales.

- Product and API specification: [FRONTEND_SPEC.md](FRONTEND_SPEC.md)
- Visual and interaction design: [design.md](design.md)
- Backend API: [serenade18/hostmeBackend](https://github.com/serenade18/hostmeBackend)

## Stack

React 19 + TypeScript, Vite, React Router, React Query, Zod + react-hook-form,
Tailwind CSS 4 with shadcn/Radix primitives, Recharts.

## Running

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at the backend
npm run dev            # http://localhost:8080
npm run build          # type-checks, then outputs dist/
```

The dev server must run on port 8080: the backend's default `SITE_URL` and
CORS settings point there, and ticket links in SMS/email use `SITE_URL`.

### Demo mode

With no `VITE_API_BASE_URL` (or `VITE_USE_MOCKS=true`) the app runs against an
in-browser simulated backend (`src/lib/api/mock.ts`) whose data lives in
`localStorage`. Demo accounts:

| Role | Email | Password |
|---|---|---|
| Organizer | org@myevents.africa | organizer1 |
| Admin | admin@myevents.africa | admin1234 |
| Sponsor | sponsor@myevents.africa | sponsor12 |

Simulated M-Pesa: payments succeed after ~8 s; a buyer phone ending in `000`
fails, one ending in `999` never pays (to see the expiry flow).

## Deployment

Static hosting with an SPA fallback, so deep links such as
`/tickets/:number/download` from SMS work on a cold load. `public/_redirects`
(Netlify) and `vercel.json` are included; for Nginx use
`try_files $uri /index.html;`.

## Layout

```
src/
  app.tsx                 route table (console routes lazy-loaded)
  lib/api/                client (auth, refresh, error normalization), endpoints, types, queries, mock
  lib/                    auth context, checkout persistence, Zod schemas, formatting
  hooks/                  order polling, countdown, page titles
  components/             layout shells, shared states, events, checkout, tickets, ui primitives
  pages/                  public/, auth/, console/, admin/
```
