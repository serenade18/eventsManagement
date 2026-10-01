# HostMe --- Frontend Design System

> **Purpose:** This document translates `FRONTEND_SPEC.md` into a
> practical visual and interaction design guide for the HostMe web
> frontend. The frontend specification defines the product, routes, API
> contracts, and required behavior; this document defines how those
> requirements should be presented and experienced.
>
> **Product:** HostMe --- event discovery and ticketing for the Kenyan
> market\
> **Primary audiences:** Ticket buyers, event organizers, sponsors, and
> administrators\
> **Platforms:** Responsive web, mobile-first\
> **Design status:** Proposed design direction; validate with product
> stakeholders before implementation.

------------------------------------------------------------------------

## 1. Design vision

HostMe should make discovering events, buying tickets, and managing
events feel clear, trustworthy, and effortless. The experience should
balance the energy of live events with the reliability expected from a
payment and ticketing platform.

### Design goals

-   **Fast discovery:** Help buyers find relevant upcoming events with
    minimal friction.
-   **Confident checkout:** Make ticket quantity, total cost, buyer
    details, and M-Pesa payment status easy to understand.
-   **Trustworthy ticket access:** Make order references, ticket
    numbers, QR codes, and delivery information prominent and legible.
-   **Efficient event operations:** Give organizers a focused console
    for creating events, managing tiers, and monitoring sales.
-   **Consistent interaction:** Use predictable components, feedback,
    and navigation across public and authenticated areas.
-   **Accessible by default:** Support keyboard navigation, readable
    contrast, labelled controls, and responsive layouts.

### Experience principles

1.  **Clarity before decoration.** Information hierarchy and action
    clarity take priority over visual effects.
2.  **One primary action per view.** Emphasize the next meaningful
    action, such as "Browse events," "Continue to payment," or "Create
    event."
3.  **Show the state.** Loading, empty, success, failure, pending, and
    expired states must be visible and understandable.
4.  **Protect buyer momentum.** Keep checkout short, avoid unnecessary
    account creation, and preserve purchase context when payment is
    interrupted.
5.  **Keep operational interfaces calm.** Console screens should
    prioritize scanability, data density, and repeatable workflows.
6.  **Design for real devices.** Buyer flows must work at 360 px wide,
    with comfortable touch targets and no horizontal scrolling.

------------------------------------------------------------------------

## 2. Product experience architecture

HostMe has two visual environments sharing one design system.

  -----------------------------------------------------------------------
  Environment       Audience          Primary purpose   Navigation
  ----------------- ----------------- ----------------- -----------------
  Public site       Buyers            Discover events,  Public top
                                      purchase tickets, navigation and
                                      retrieve tickets  footer

  Organizer console Organizers and    Manage events,    Sidebar on
                    admins            tickets,          desktop; compact
                                      attendees, and    navigation on
                                      performance       mobile

  Sponsor account   Sponsors          Manage profile    Profile-focused
                                                        console
                                                        navigation
  -----------------------------------------------------------------------

### Public experience

The public site should feel event-led and welcoming. Event posters are
the primary visual content. Browsing pages use card grids, clear dates
and venues, and direct paths into event details.

### Console experience

The console should feel structured and task-oriented. Use a persistent
navigation shell, clear page titles, summary cards, tables, and explicit
event-management actions. Avoid unnecessary promotional content in the
console.

### Shared shell

-   Shared typography, color tokens, form controls, buttons, status
    badges, dialogs, and notifications.
-   Separate public and console layouts to avoid mixing buyer navigation
    with operational navigation.
-   Consistent responsive behavior and accessibility semantics.
-   Role-aware navigation based on `user_type`; backend authorization
    remains authoritative.

------------------------------------------------------------------------

## 3. Visual direction

### Proposed visual character

Use a **modern, editorial event-platform aesthetic**: strong typography,
confident spacing, expressive event imagery, and restrained interface
chrome. The interface should feel lively on public pages and composed in
the console.

The supplied frontend specification does not prescribe brand colors,
logo usage, or a finalized visual identity. The palette below is
therefore a proposed starting point, not an existing brand requirement.

### Color palette

  ------------------------------------------------------------------------
  Token                               Proposed value Usage
  --------------------- ---------------------------- ---------------------
  `brand-950`                              `#172554` Deep brand surfaces,
                                                     high-emphasis text on
                                                     light backgrounds

  `brand-800`                              `#1E40AF` Strong brand elements

  `brand-700`                              `#1D4ED8` Primary buttons,
                                                     links, selected
                                                     controls

  `brand-100`                              `#DBEAFE` Soft brand
                                                     backgrounds, selected
                                                     states

  `brand-50`                               `#EFF6FF` Subtle brand-tinted
                                                     panels

  `ink`                                    `#111827` Main text

  `ink-muted`                              `#4B5563` Secondary text

  `ink-subtle`                             `#6B7280` Metadata and helper
                                                     text

  `surface`                                `#FFFFFF` Cards, forms, and
                                                     main surfaces

  `canvas`                                 `#F8FAFC` Page background

  `border`                                 `#E5E7EB` Dividers, input
                                                     borders, card
                                                     outlines

  `success`                                `#15803D` Paid, completed, and
                                                     successful states

  `success-soft`                           `#DCFCE7` Success badge and
                                                     panel backgrounds

  `warning`                                `#B45309` Pending and attention
                                                     states

  `warning-soft`                           `#FEF3C7` Pending badge and
                                                     alert backgrounds

  `danger`                                 `#B91C1C` Failed, destructive,
                                                     and error states

  `danger-soft`                            `#FEE2E2` Error badge and alert
                                                     backgrounds

  `info`                                   `#0369A1` Informational
                                                     messages

  `info-soft`                              `#E0F2FE` Informational panel
                                                     backgrounds
  ------------------------------------------------------------------------

#### Color usage rules

-   Use the primary brand color for the principal action in a view, not
    every clickable element.
-   Maintain at least **4.5:1 contrast** for normal text and **3:1** for
    large text and meaningful UI boundaries, in line with the required
    WCAG 2.1 AA target.
-   Status must never be communicated by color alone; pair it with a
    text label and, where useful, an icon.
-   Keep large page backgrounds neutral so posters and event photography
    remain visually prominent.
-   Dark QR-code backing is mandatory because the backend QR image is
    white on transparent.

### Typography

Use a clean sans-serif family such as **Inter** or a metrically similar
system sans-serif. Confirm font licensing and loading strategy during
implementation.

  -------------------------------------------------------------------------
  Text role             Suggested size               Weight Usage
  --------------- -------------------- -------------------- ---------------
  Display                    40--56 px             700--800 Homepage hero
                                                            and major
                                                            success moments

  Page title                 28--36 px                  700 Page and
                                                            console titles

  Section title              20--24 px             600--700 Content section
                                                            headings

  Card title                 16--20 px                  600 Event and
                                                            dashboard card
                                                            titles

  Body                       14--16 px                  400 Descriptions
                                                            and primary
                                                            content

  Supporting                 12--14 px             400--500 Metadata,
                                                            helper text,
                                                            table labels

  Numeric                    24--32 px                  700 Dashboard stats
  emphasis                                                  and totals

  Ticket                     14--16 px                  600 Monospace
  identifier                                                ticket and
                                                            order
                                                            references
  -------------------------------------------------------------------------

Typography rules:

-   Use sentence case for headings, labels, buttons, and navigation.
-   Use tabular numerals for financial totals, quantities, and dashboard
    metrics.
-   Use a monospace font for ticket numbers and order references.
-   Keep paragraph line length comfortable; avoid long full-width text
    blocks.
-   Avoid low-contrast, overly small metadata on mobile.

### Spacing and layout

Use a consistent 4 px base spacing scale.

  Token          Value Typical use
  ------------ ------- ---------------------------------
  `space-1`       4 px Icon/text gap
  `space-2`       8 px Tight control spacing
  `space-3`      12 px Compact card spacing
  `space-4`      16 px Standard component spacing
  `space-5`      20 px Form group spacing
  `space-6`      24 px Card padding on compact layouts
  `space-8`      32 px Section spacing
  `space-10`     40 px Large section spacing
  `space-12`     48 px Page section separation
  `space-16`     64 px Large desktop section spacing

Layout guidance:

-   Public content max width: approximately 1200--1280 px.
-   Console content max width: approximately 1440 px, allowing tables to
    use available space.
-   Desktop page gutters: 32--48 px; tablet: 24 px; mobile: 16 px.
-   Use responsive grids rather than fixed card widths.
-   Avoid layout shifts by reserving poster and QR image dimensions.

### Shape, borders, and elevation

  -----------------------------------------------------------------------
  Element                             Guidance
  ----------------------------------- -----------------------------------
  Small controls                      8 px radius

  Cards and panels                    12--16 px radius

  Dialogs and large feature panels    16--20 px radius

  Pills and status badges             Fully rounded

  Borders                             1 px neutral border for structure

  Shadows                             Soft and restrained; use primarily
                                      for overlays and floating elements
  -----------------------------------------------------------------------

Use elevation to express layering, not to decorate every card. Prefer
border-defined cards in the console for a quieter, more data-focused
appearance.

### Iconography

-   Use a consistent line-icon family such as Lucide.
-   Icons should reinforce labels, not replace important text.
-   Keep icon sizes consistent: 16 px for compact controls, 18--20 px
    for standard actions, and 24 px for prominent illustrations.
-   Avoid emoji as interface icons.
-   Provide accessible names for icon-only controls.

------------------------------------------------------------------------

## 4. Theme and design tokens

Define tokens centrally in Tailwind configuration and CSS variables.
Support light and dark themes as required by the frontend specification.

### Semantic tokens

``` css
:root {
  --color-brand: #1D4ED8;
  --color-brand-hover: #1E40AF;
  --color-brand-soft: #EFF6FF;

  --color-canvas: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-raised: #FFFFFF;
  --color-border: #E5E7EB;

  --color-text: #111827;
  --color-text-muted: #4B5563;
  --color-text-subtle: #6B7280;

  --color-success: #15803D;
  --color-success-soft: #DCFCE7;
  --color-warning: #B45309;
  --color-warning-soft: #FEF3C7;
  --color-danger: #B91C1C;
  --color-danger-soft: #FEE2E2;
  --color-info: #0369A1;
  --color-info-soft: #E0F2FE;

  --radius-control: 8px;
  --radius-card: 14px;
  --radius-dialog: 18px;
}
```

### Dark theme guidance

Dark mode should use deep neutral surfaces rather than pure black.
Maintain readable contrast, preserve semantic status colors, and ensure
QR codes remain legible on a dark backing. Theme changes must not alter
the meaning of status colors or reduce focus visibility.

Suggested dark semantic direction:

-   Canvas: deep slate/charcoal.
-   Surface: elevated slate.
-   Text: near-white.
-   Secondary text: cool gray.
-   Borders: muted slate.
-   Brand: a brighter blue with sufficient contrast on dark surfaces.

Exact dark values should be contrast-tested before release.

------------------------------------------------------------------------

## 5. Responsive behavior

### Breakpoint guidance

Use Tailwind's standard breakpoints unless implementation reveals a
concrete need to adjust them.

  -----------------------------------------------------------------------
  Range                               Layout behavior
  ----------------------------------- -----------------------------------
  `< 640 px`                          Single-column buyer flows; compact
                                      header; cards stacked; console
                                      sidebar becomes mobile navigation

  `640–767 px`                        Two-column event cards where space
                                      permits; compact forms

  `768–1023 px`                       Tablet layouts; console navigation
                                      may collapse

  `1024–1279 px`                      Full console shell; two- or
                                      three-column public grids

  `≥ 1280 px`                         Wider content grids and spacious
                                      dashboard layouts
  -----------------------------------------------------------------------

### Mobile requirements

-   Checkout and payment pages must work at **360 px** without
    horizontal scrolling.
-   Interactive targets should be at least **44 × 44 px**.
-   Use full-width primary actions in narrow layouts.
-   Keep ticket total, payment status, and event identity visible
    without excessive scrolling.
-   Tables should become stacked cards or use deliberate horizontal
    overflow within the table region only; the overall page must not
    overflow.
-   Keep filters accessible through a compact filter panel or drawer.
-   Do not rely on hover to expose essential actions.

------------------------------------------------------------------------

## 6. Navigation and information architecture

### Public navigation

Recommended desktop header:

-   HostMe brand mark
-   Events
-   Find my ticket
-   Organizer sign-in / console entry

Recommended mobile header:

-   Brand mark
-   Menu button with accessible label
-   Find ticket action available without deep navigation

Public footer:

-   Browse events
-   Find my ticket
-   Organizer login
-   Support contact from `VITE_SUPPORT_CONTACT`
-   Terms/privacy links only when product URLs are supplied; do not
    invent destinations

### Console navigation

Recommended primary navigation:

-   Dashboard --- organizer and admin
-   My events --- organizer and admin
-   Tickets --- organizer and admin
-   Profile --- all authenticated roles
-   Change password --- all authenticated roles
-   Users --- admin only

Sponsors should land on Profile and should not see dashboard features
that the backend does not provide.

### Route behavior

-   Preserve the requested destination in `?next=` when redirecting
    unauthenticated users to login.
-   After authentication, load `/userinfo/` and use `user_type` for
    navigation and route visibility.
-   Route guards improve user experience but do not replace backend
    permission checks.
-   Unknown routes render a branded not-found view with a route back to
    Events or the console, depending on context.

------------------------------------------------------------------------

## 7. Core components

### Buttons

Variants:

-   **Primary:** Main action, such as Buy ticket, Continue, Save
    changes.
-   **Secondary:** Supporting action, such as View event or Cancel.
-   **Outline:** Low-emphasis action with a visible boundary.
-   **Ghost:** Navigation or tertiary action.
-   **Danger:** Destructive action, such as Delete event or Delete
    account.
-   **Link:** Inline navigation action.

States:

-   Default, hover, focus-visible, active, disabled, loading.
-   Loading buttons must prevent duplicate submission and retain a clear
    label or progress indicator.
-   Button text should describe the action; avoid vague labels such as
    "Submit" when a specific action is possible.

### Inputs and forms

-   Always show a visible label.
-   Use helper text for formatting requirements and optional fields.
-   Show field-level errors directly below the field.
-   Preserve entered values when server validation fails.
-   Use correct input types, autocomplete hints, and mobile-friendly
    keyboards.
-   Clearly distinguish required and optional fields.
-   Avoid placeholder-only labels.

### Cards

Use consistent card anatomy:

1.  Optional media or poster
2.  Category or status label
3.  Title
4.  Key metadata
5.  Supporting description, where appropriate
6.  Price or metric
7.  Contextual action

### Badges

Use text plus color for:

-   Event: Upcoming, Active, Past, Closed, Featured
-   Order: Pending, Paid, Failed, Expired, Refund required
-   Ticket: Issued, Awaiting QR, Purchased

Avoid ambiguous labels. For example, use "Payment pending" rather than
only "Pending" where context is not obvious.

### Tables

-   Clear column headings and consistent alignment.
-   Right-align currency and numeric values.
-   Keep identifiers visually distinct with monospace typography.
-   Provide search, filters, empty states, and export actions where
    specified.
-   On mobile, use cards or a contained horizontal-scroll region.
-   Confirm destructive actions in a dialog.

### Dialogs and toasts

-   Dialogs are for decisions that require attention, such as delete
    confirmation.
-   Toasts are for brief outcomes, not critical payment status or form
    errors.
-   Dialogs must trap focus, close with Escape where appropriate, and
    return focus to the triggering control.
-   Use `aria-live="polite"` for status changes and toasts.

### Loading, empty, and error states

Every data view must support:

-   **Loading:** Skeletons matching the eventual layout; avoid full-page
    spinners.
-   **Empty:** Explain why the view is empty and offer a relevant next
    action.
-   **Error:** Show the normalized human-readable API message and a
    Retry action.
-   **Success:** Confirm completion and show the next useful action.

Do not display raw API JSON or `[object Object]`.

------------------------------------------------------------------------

## 8. Public page designs

### 8.1 Home --- `/`

**Purpose:** Introduce HostMe and move buyers into event discovery.

Structure:

1.  Public header
2.  Hero section with concise headline, supporting copy, and "Browse
    events" CTA
3.  Featured events section
4.  Upcoming events section, maximum 8
5.  "See all events" link
6.  Public footer

Design notes:

-   Use a strong but restrained hero treatment; event imagery can
    provide energy without obscuring the CTA.
-   Feature cards should prioritize poster, title, date/time, venue, and
    price-from/free indicator.
-   Do not show organizer email or phone from the public event payload.
-   If no featured events exist, do not leave a large blank section;
    omit the section or use a compact empty message.
-   Upcoming events are sorted soonest first; past events are excluded
    from this section.

### 8.2 Events --- `/events`

**Purpose:** Support browsing and narrowing the event list.

Structure:

1.  Page title and short introduction
2.  Search field
3.  Filters: category, date range, and price type
4.  Active filter indicators and clear-filters action
5.  Responsive event grid
6.  Empty/error/loading states

Event card content:

-   Poster with fixed aspect ratio and fallback for null posters
-   Category chip
-   Event title
-   Date and time in the event's local values
-   Venue
-   "From KES X" or "Free"
-   Card-level navigation to event detail

Interaction:

-   Search across title, venue, and category.
-   Filter by upcoming, this week, this month, or past; free or paid.
-   Keep filter state in the query string so results can be shared.
-   Default to upcoming events, soonest first.

### 8.3 Event detail --- `/events/:id`

**Purpose:** Give buyers enough information to choose a ticket tier.

Suggested desktop layout:

-   Main column: poster, title, category, description, organizer display
    name, optional sponsor information
-   Supporting column: event date/time, venue, and ticket tier panel

Mobile layout:

-   Poster and event identity first
-   Event metadata
-   Description
-   Ticket tiers and purchase actions

Ticket tier card:

-   Tier name
-   Description
-   Price in KES or Free
-   Sales availability label
-   Buy action when sales are available

Availability states:

-   Before `sales_start`: "On sale from \[date\]"; disable buying.
-   After `sales_end`: "Sales closed"; disable buying.
-   Past event: show "This event has ended"; disable buying.
-   `is_open === false`: disable buying and show a clear closed-sales
    state.
-   Do not show remaining stock or "sold out" before the backend
    confirms it; stock is not returned by the API.

### 8.4 Checkout --- `/events/:id/checkout?tier=:ticketTypeId`

**Purpose:** Collect buyer details and initiate ticket purchase.

Layout:

-   Compact step indicator or clear page heading
-   Event/tier summary
-   Quantity selector (1--10)
-   Buyer details form
-   Order summary with unit price and calculated total
-   Primary action to continue to payment or issue free tickets

Form fields:

-   Full name --- required
-   Kenyan mobile number --- required
-   Email --- optional, with explanation that tickets can also be
    emailed

Interaction:

-   Update total immediately when quantity changes.
-   Keep the event and selected tier visible.
-   Disable the purchase action while submitting and prevent duplicate
    requests.
-   On validation failure, show field errors and preserve values.
-   Do not require buyer account creation.

### 8.5 Payment waiting --- `/orders/:reference/pay`

**Purpose:** Explain the M-Pesa step and provide reliable status
feedback.

Layout:

-   Focused, low-distraction payment panel
-   Event and tier summary
-   Amount due
-   Phone prompt illustration or simple phone/payment visual
-   Clear instruction to check the phone and complete the M-Pesa prompt
-   Countdown to `expires_at`
-   Current payment status and support information

States:

  -----------------------------------------------------------------------
  Backend status          Visual treatment        Primary guidance
  ----------------------- ----------------------- -----------------------
  `pending`               Neutral/amber progress  Check phone and
                                                  complete the prompt

  `paid`                  Success                 Continue to order
                                                  confirmation

  `failed`                Error                   Retry with a new order

  `expired`               Muted warning           Start the purchase
                                                  again; continue slow
                                                  polling for late
                                                  payment

  `refund_required`       High-visibility support Contact support with
                          notice                  the order reference
  -----------------------------------------------------------------------

Behavior:

-   Poll `GET /orders/:reference/` every 3 seconds for the first 2
    minutes, then every 10 seconds until `expires_at` + 2 minutes.
-   Pause polling while the tab is hidden and fetch immediately on
    return.
-   Network errors must not be presented as payment failures.
-   Preserve enough purchase context to resume after reload.
-   Show "Didn't get the prompt?" and retry guidance after 90 seconds
    while pending.
-   Use accessible live announcements for status changes.

### 8.6 Order confirmation --- `/orders/:reference`

**Purpose:** Confirm the order and provide access to every issued
ticket.

Content:

-   Success heading ("You're going!")
-   Event summary
-   Order reference
-   Total paid
-   Ticket cards for each ticket
-   SMS delivery confirmation with masked phone
-   Email delivery note when an email was provided

Ticket card:

-   Event name
-   Tier
-   Ticket number
-   QR code or temporary placeholder
-   View ticket action

Behavior:

-   If order status is not paid, route to payment waiting.
-   QR codes may be temporarily unavailable; show a placeholder and poll
    every 2 seconds for up to approximately 30 seconds.
-   Keep order reference easy to copy.
-   Do not expose unmasked buyer contact details.

### 8.7 Ticket --- `/tickets/:ticketNumber` and `/tickets/:ticketNumber/download`

**Purpose:** Make gate validation and ticket retrieval straightforward.

Ticket visual hierarchy:

1.  Event name and poster/brand treatment
2.  Tier name
3.  Buyer name
4.  Ticket number
5.  QR code on a dark backing with adequate padding
6.  Purchase date
7.  Download QR, Print, and Add to calendar actions

QR requirements:

-   QR images are white on transparent; always display on a dark
    surface.
-   Provide meaningful alt text: "QR code for ticket \[number\]".
-   Keep the QR large enough to scan on a phone.
-   Print styles must preserve the dark QR backing.
-   Hide site navigation in print and print one ticket per page.
-   `/download` must work on a cold load because this exact path is used
    in SMS/email.

Not-found state:

-   Explain that the ticket could not be found.
-   Link to Find my ticket.
-   Treat the backend's documented 400 "No Ticket matches" response as
    not found.

### 8.8 Find my ticket --- `/find-ticket`

**Purpose:** Help buyers recover access without signing in.

-   One prominent input labelled "Ticket number or order reference".
-   Explain accepted reference format briefly.
-   Submit action with loading feedback.
-   Lookup order first; if not found, lookup ticket.
-   On match, route to the order or ticket view.
-   On no match, show a helpful message and allow correction.

------------------------------------------------------------------------

## 9. Authentication page designs

### 9.1 Login --- `/login`

-   Focused authentication panel with email and password.
-   Clear "Log in" action.
-   Link to registration.
-   Field validation and readable server error for invalid credentials.
-   Honour `?next=` after successful login.
-   If already authenticated, redirect to `/console`.

### 9.2 Register --- `/register`

-   Name, email, phone, optional organization, password, confirm
    password, and account type.
-   Account type choices are Organizer and Sponsor only; never expose
    Admin registration.
-   Explain the difference only to the extent supported by current
    product capabilities.
-   Show server field errors below corresponding fields.
-   After successful registration, auto-login and route to `/console`.

------------------------------------------------------------------------

## 10. Organizer console designs

### 10.1 Console shell

Desktop:

-   Persistent left sidebar
-   Top bar with current page context and user menu
-   Main content area with consistent gutters
-   Optional page-level actions aligned with the page title

Mobile:

-   Compact top bar
-   Navigation drawer or bottom navigation with accessible labels
-   Tables adapted to cards or contained horizontal scrolling
-   Forms displayed in a single column

### 10.2 Dashboard --- `/console`

**Purpose:** Give organizers an at-a-glance view of event performance.

Top section:

-   Page title and date/context label if available
-   Quick actions: Create event, View tickets

Stat tiles:

-   Tickets sold
-   Revenue
-   Platform fee (10%)
-   Net revenue
-   Events
-   Active events

Analytics:

-   Monthly tickets bar chart and revenue line chart from `monthlyData`.
-   Use clear axes, legends, tooltips, and accessible summaries.
-   Do not imply precision beyond the supplied data.
-   Hide demographics or label them "Sample data" because the backend
    currently returns placeholder values.

Recent events:

-   Latest 5 events from `topEvents`
-   Name, tickets, revenue, status
-   Link to event overview where an event identifier is available; do
    not fabricate an identifier from a name.

### 10.3 My events --- `/console/events`

-   Page title with "Create event" primary action.
-   Upcoming/Past tabs.
-   Search by title.
-   Event rows/cards with poster thumbnail, title, date, venue, tier
    count, open/closed state, featured state.
-   Actions: View, Edit, Delete.
-   Confirm deletion in a modal.
-   If deletion is rejected because orders exist, explain that events
    with ticket orders cannot be deleted.

### 10.4 Create/edit event

Fields:

-   Title
-   Category select with common options and free-text support
-   Description
-   Venue
-   Date and time
-   Poster upload with preview
-   On sale (`is_open`)
-   Free event (`is_free`)
-   Featured (`is_feature`), admin-only in the UI
-   Repeatable ticket tier editor

Poster upload:

-   Accept JPG, PNG, and WebP.
-   Client-side maximum: 5 MB.
-   Show selected image preview, filename, and replace/remove controls.
-   Provide a fallback when no poster is selected.

Tier editor:

-   Tier name
-   Description
-   Price (KES)
-   Quantity/capacity
-   Sales start
-   Sales end
-   Add/remove tier controls
-   At least one tier is required

Edit behavior:

-   Once a tier has orders, lock the tier editor as read-only.
-   Explain that replacing tiers is not supported after sales begin.
-   Omit `ticket_type` from the update payload when locked, allowing
    other event fields to be edited.
-   Use multipart form submission as required by the API.

Success:

-   Show confirmation.
-   Refetch event list because create does not return the new event ID.
-   Navigate to the event overview once the created event can be
    identified.

### 10.5 Event overview --- `/console/events/:id`

-   Event header with poster, title, date, venue, status, and Edit
    action.
-   Public event URL with copy action.
-   Ticket tier performance: price, capacity, sold, revenue.
-   Attendee table: ticket number, buyer name, phone, email, tier,
    purchase date.
-   CSV export generated client-side.
-   Mask or limit personal contact information to the authenticated
    operational context; do not expose it publicly.

### 10.6 Tickets --- `/console/tickets`

-   Search by ticket number, event, tier, or buyer as appropriate to
    available fields.
-   Filter by event.
-   Newest-first ordering.
-   Table columns: ticket number, event, tier, buyer, phone, purchase
    date.
-   CSV export.
-   Provide empty, loading, and error states.

### 10.7 Profile --- `/console/profile`

-   Editable name, phone, organization, country, city, and bio.
-   Email is read-only.
-   Save action with field-level errors.
-   Account deletion in a clearly separated danger zone, requiring typed
    confirmation.
-   After account deletion, clear local session and return to public
    home or login.

### 10.8 Password --- `/console/password`

-   Current password
-   New password
-   Confirm new password
-   Explain password requirements before submission.
-   Show success or server error without exposing raw response data.

### 10.9 Users --- `/console/users` (admin only)

-   Admin-only page.
-   Search and role filter.
-   Table of name, email, phone, role, and joined date.
-   No organizer-facing user list is assumed; sponsor selection should
    remain unavailable to organizers until the backend exposes a data
    source.

### 10.10 Sponsor profile

Sponsors currently have profile management only. Keep the experience
intentionally focused on profile and password management. Do not display
empty or fictional sponsor dashboards.

------------------------------------------------------------------------

## 11. Ticket purchase and payment interaction design

### Purchase stages

1.  Select event.
2.  Select ticket tier.
3.  Choose quantity.
4.  Enter buyer details.
5.  Submit purchase.
6.  For free tickets, show confirmation.
7.  For paid tickets, wait for M-Pesa payment.
8.  Confirm order and show issued tickets.

### Checkout feedback

-   Show quantity and total before purchase.
-   Use a persistent summary on larger screens where practical.
-   On mobile, keep the total and primary action close together without
    covering form content.
-   Prevent repeated submissions after the first accepted click.
-   Display backend validation messages in plain language.

### Payment status language

Use direct, non-technical language:

-   Pending: "Waiting for your M-Pesa payment."
-   Paid: "Payment received. Your tickets are ready."
-   Failed: "The payment was not completed. You can try again."
-   Expired: "This payment request has expired. Start a new payment."
-   Refund required: "We received your payment, but tickets could not be
    issued. Contact support with this reference."

Do not claim payment success based only on a local timer or a payment
prompt being sent. The order endpoint is the preferred source of truth.

### Persistence and recovery

Persist the documented in-progress checkout context in `localStorage`
under `hostme.checkout`, excluding email. Clear it on terminal states.
On reload, recover the payment view and fetch current order status
before deciding where to route the buyer.

------------------------------------------------------------------------

## 12. Data presentation and formatting

  -----------------------------------------------------------------------
  Data                                Presentation
  ----------------------------------- -----------------------------------
  Money                               Convert string/number to numeric
                                      value, format as KES using
                                      `Intl.NumberFormat('en-KE')`; show
                                      "Free" for zero

  Event date/time                     Combine event `date` and `time` as
                                      local event values; do not
                                      timezone-convert them

  API datetimes                       Display in `Africa/Nairobi`

  Countdown                           `mm:ss`

  Phone on public pages               Mask middle digits,
                                      e.g. `07XX XXX 678`

  Ticket number                       Monospace; uppercase display is
                                      acceptable, but send original value
                                      for lookup

  Status                              Text label plus semantic color/icon

  Null poster                         Use a consistent fallback poster

  Null QR                             Use a visible placeholder until
                                      available
  -----------------------------------------------------------------------

Formatting must be centralized in shared composables such as `useMoney`
and `useDates`.

------------------------------------------------------------------------

## 13. Motion and feedback

Motion should reinforce state changes and orientation, not delay tasks.

-   Use short transitions for hover, focus, menu, and dialog changes.
-   Use a restrained success animation after confirmed payment,
    respecting reduced-motion preferences.
-   Avoid decorative animation on dashboard charts and dense tables.
-   Use skeleton transitions sparingly.
-   Respect `prefers-reduced-motion`.
-   Do not use animation as the only indicator of loading or success.

------------------------------------------------------------------------

## 14. Accessibility

Target **WCAG 2.1 AA** as required by the frontend specification.

-   Use semantic landmarks, headings, lists, tables, and buttons.
-   Every input has a programmatic label.
-   Focus indicators are clearly visible.
-   All menus, dialogs, tabs, and controls are keyboard-operable.
-   Dialogs trap focus, close with Escape where appropriate, and restore
    focus.
-   Maintain sufficient contrast for text, controls, and status
    indicators.
-   Use `aria-live="polite"` for payment status changes and toasts.
-   Provide descriptive poster and QR alt text.
-   Ensure chart data is also available in a textual or tabular form.
-   Do not rely on hover, color, or animation alone.
-   Test the checkout and ticket flows at mobile viewport sizes and with
    keyboard-only navigation.

------------------------------------------------------------------------

## 15. Content and microcopy

### Voice

-   Clear, helpful, and calm.
-   Use familiar terms and avoid backend terminology.
-   Keep payment instructions explicit.
-   Be transparent about optional information and what happens next.

### Content rules

-   Use "ticket" consistently for an issued admission item.
-   Use "order reference" for the purchase-level identifier.
-   Use "ticket number" for an individual ticket identifier.
-   Use "M-Pesa" consistently.
-   Use "KES" for currency display.
-   Avoid claims about remaining ticket stock because the API does not
    provide remaining inventory.
-   Do not show organizer email or phone on public event pages.
-   Use support contact from configuration rather than hard-coded
    contact details.

### Example action labels

  Context             Label
  ------------------- ----------------------------------------
  Home hero           Browse events
  Event card          View event
  Ticket tier         Buy ticket
  Checkout            Continue to payment / Get free tickets
  Payment             Check your phone
  Ticket retrieval    Find my ticket
  Organizer console   Create event
  Event management    View / Edit / Delete
  Ticket action       Download QR / Print / Add to calendar

------------------------------------------------------------------------

## 16. Security-sensitive presentation

-   Never expose tokens, credentials, or payment secrets in the UI or
    client configuration.
-   Do not attach authorization tokens to public event, order, purchase,
    or ticket requests.
-   Never render API-provided HTML with `v-html`.
-   Avoid exposing organizer email/phone on public event pages.
-   Mask buyer phone numbers on public ticket/order screens.
-   Do not offer admin registration.
-   Treat frontend role checks as navigation and usability controls
    only; backend permissions remain authoritative.
-   Confirm destructive actions and explain their consequences.
-   Avoid logging sensitive buyer information in client-side
    diagnostics.

------------------------------------------------------------------------

## 17. Design QA checklist

### Visual consistency

-   [ ] Colors, typography, spacing, radius, and shadows use centralized
    tokens.
-   [ ] Public and console layouts are visually distinct but share
    components.
-   [ ] Buttons, inputs, badges, cards, dialogs, and tables have
    consistent states.
-   [ ] Event posters maintain a stable aspect ratio and do not cause
    layout shift.
-   [ ] QR codes render on dark backing on screen and in print.

### Responsive behavior

-   [ ] Public pages work on narrow mobile, tablet, and desktop.
-   [ ] Checkout and payment pages work at 360 px without horizontal
    overflow.
-   [ ] Tap targets are at least 44 × 44 px.
-   [ ] Console navigation adapts to small screens.
-   [ ] Tables remain usable on mobile.

### Interaction states

-   [ ] Every data view has loading, empty, error, retry, and success
    states as applicable.
-   [ ] Forms show client and server validation.
-   [ ] Duplicate purchase submissions are prevented.
-   [ ] Payment status is driven by the order API.
-   [ ] Failed/expired payment recovery preserves relevant checkout
    details.
-   [ ] Ticket retrieval works from a cold-loaded SMS/email link.
-   [ ] Destructive actions require confirmation.

### Accessibility

-   [ ] Keyboard navigation works across public and console experiences.
-   [ ] Focus is visible and correctly managed in dialogs.
-   [ ] Text and control contrast meet WCAG 2.1 AA.
-   [ ] Inputs have labels and errors are associated with fields.
-   [ ] Status changes are announced accessibly.
-   [ ] QR and poster images have meaningful alt text.
-   [ ] Charts have a textual equivalent.

### Product/API alignment

-   [ ] Public event pages never expose organizer contact details.
-   [ ] No unsupported stock availability is shown.
-   [ ] Sponsor pages do not imply unavailable features.
-   [ ] Demographics are hidden or clearly marked as sample data.
-   [ ] Event tier editing is locked after orders exist.
-   [ ] All displayed statuses and purchase transitions match the
    documented API.

------------------------------------------------------------------------

## 18. Implementation notes

-   Implement tokens in Tailwind and CSS variables rather than
    scattering literal values through components.
-   Build reusable UI primitives before page-specific styling.
-   Keep public and console shells separate.
-   Use typed API response models and normalize responses before they
    reach view components.
-   Lazy-load console routes and chart dependencies.
-   Use fixed image aspect ratios and lazy-load poster images.
-   Keep public events cached for the documented 60-second window.
-   Use MSW fixtures based on the actual API examples in
    `FRONTEND_SPEC.md`.
-   Verify route deep-link fallback in the deployed SPA host.
-   Validate all theme combinations, especially status badges, focus
    rings, and QR readability.

------------------------------------------------------------------------

## 19. Source alignment and open design decisions

This document is derived from the supplied `FRONTEND_SPEC.md`. The
source specifies the product workflows, pages, API behavior, responsive
constraints, accessibility target, and implementation stack. It does
**not** define a finalized brand identity, approved logo treatment, or
final color palette.

The following are proposed design decisions that should be confirmed
before implementation:

-   Final HostMe brand colors and logo usage.
-   Approved typeface and font-loading strategy.
-   Whether dark mode is user-selectable or follows system preference.
-   Final event poster aspect ratio and fallback artwork.
-   Terms, privacy, and support destination URLs.
-   Exact chart visual treatment and dashboard density.

Do not alter API contracts or invent product capabilities as part of
visual implementation. If the backend behavior changes, update the
frontend specification and this design document together.
