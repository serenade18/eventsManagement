import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Download,
  Gift,
  ImagePlus,
  Layers,
  MessageSquare,
  QrCode,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SUPPORT_CONTACT } from "@/lib/api/client";
import { homeFor, useAuth } from "@/lib/auth";
import { useTitle } from "@/hooks/use-title";

// Every claim here maps to something MyEvents does today. No card payments, payout
// schedules or scanner apps: the backend doesn't offer them.
const STEPS = [
  {
    Icon: ImagePlus,
    title: "Create",
    body: "Add a poster, a date and venue, and at least one ticket type. Set a price, a capacity and when sales open and close.",
  },
  {
    Icon: Smartphone,
    title: "Sell",
    body: "Share your event link. Buyers pay with an M-Pesa prompt on their phone, with no account to create.",
  },
  {
    Icon: BarChart3,
    title: "Track",
    body: "Watch tickets and revenue come in, see who's coming, and export your attendee list.",
  },
];

const FEATURES = [
  {
    Icon: Layers,
    title: "Ticket tiers",
    body: "Early bird, Regular, VIP: each with its own price, capacity and sales window.",
  },
  { Icon: Gift, title: "Free events too", body: "RSVP-style free tickets are issued instantly." },
  {
    Icon: MessageSquare,
    title: "Tickets by SMS and email",
    body: "Buyers get their tickets straight away, each with a unique QR code.",
  },
  {
    Icon: QrCode,
    title: "QR on every ticket",
    body: "Buyers can download the QR, print their ticket, or add the event to their calendar.",
  },
  {
    Icon: BarChart3,
    title: "Sales dashboard",
    body: "Tickets sold, revenue, platform fee and net revenue, month by month.",
  },
  {
    Icon: Download,
    title: "Attendee export",
    body: "Names, phones and ticket numbers per event, as a CSV.",
  },
];

const FAQ = [
  {
    q: "Do my buyers need an account?",
    a: "No. They choose a ticket, enter their name and phone number, and approve the M-Pesa prompt. Tickets arrive by SMS, and by email if they give one.",
  },
  {
    q: "What does it cost?",
    a: "MyEvents keeps a 10% platform fee on paid ticket sales, shown on your dashboard next to your net revenue. Free events don't incur a fee.",
  },
  {
    q: "Can I change ticket types after I start selling?",
    a: "You can edit the event's details at any time. Ticket types lock once the first ticket is sold, so buyers always get what they paid for.",
  },
  {
    q: "Can I delete an event?",
    a: "Yes, as long as nobody has bought a ticket yet. After that, close sales instead.",
  },
  {
    q: "How do I get help?",
    a: `Email ${SUPPORT_CONTACT} and we'll get back to you.`,
  },
];

export default function OrganizersPage() {
  useTitle("Sell tickets on MyEvents", {
    description: "Create an event, sell tickets with M-Pesa, and track sales from one dashboard.",
  });
  const { status, user } = useAuth();
  const authed = status === "authed";

  const primary = authed ? (
    <Button asChild size="lg">
      <Link to={homeFor(user)}>
        Go to your console <ArrowRight />
      </Link>
    </Button>
  ) : (
    <Button asChild size="lg">
      <Link to="/register">
        Create an account <ArrowRight />
      </Link>
    </Button>
  );

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#172554] text-white dark:bg-[#0b1220]">
        <div
          className="absolute inset-0 -z-10 opacity-60 [background:radial-gradient(55%_75%_at_90%_0%,#1d4ed8_0%,transparent_60%),radial-gradient(45%_60%_at_0%_100%,#0369a1_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
              For organizers
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Sell out your next event.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-blue-100/90">
              Set up your event in minutes, take M-Pesa payments, and get your attendees in with a
              QR code. All from one dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {primary}
              {!authed && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
              )}
            </div>
          </div>
          <ConsolePreview />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
        <section aria-labelledby="steps">
          <h2 id="steps" className="text-2xl font-bold sm:text-3xl">
            From idea to sold out in three steps
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ Icon, title, body }, i) => (
              <li key={title} className="rounded-2xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground tabular">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="features" className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="features" className="text-2xl font-bold sm:text-3xl">
              Everything you need on the night
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for Kenyan events: phones first, M-Pesa first, and simple enough to run from
              your phone.
            </p>
          </div>
          <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {FEATURES.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq" className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <h2 id="faq" className="text-2xl font-bold sm:text-3xl">
            Questions organizers ask
          </h2>
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border bg-surface px-5"
          >
            {FAQ.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`q${i}`} className="last:border-b-0">
                <AccordionTrigger className="min-h-14 text-left text-base font-semibold hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="rounded-2xl bg-brand px-6 py-10 text-center text-primary-foreground sm:px-10 sm:py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready when you are.</h2>
          <p className="mx-auto mt-2 max-w-md opacity-90">
            Create your account and have your first event ready to share today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {authed ? (
              <Button asChild size="lg" className="bg-white text-[#1d4ed8] hover:bg-blue-50">
                <Link to="/console/events/new">Create an event</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-white text-[#1d4ed8] hover:bg-blue-50">
                  <Link to="/register">Create an account</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/50 bg-transparent text-white hover:bg-white/10"
                >
                  <Link to="/events">Back to events</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/** Decorative sketch of the console. Illustrative numbers, hidden from assistive tech. */
function ConsolePreview() {
  const bars = [28, 42, 35, 58, 74, 92];
  return (
    <div className="relative hidden sm:block" aria-hidden>
      <div className="rounded-2xl bg-white p-5 text-[#111827] shadow-2xl ring-1 ring-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#6b7280]">Your event</p>
            <p className="font-bold">Saturday Sessions</p>
          </div>
          <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#15803d]">
            On sale
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            ["Tickets", "312"],
            ["Revenue", "KES 468k"],
            ["Tiers", "3"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-[#e5e7eb] p-3">
              <p className="text-[11px] text-[#6b7280]">{k}</p>
              <p className="mt-0.5 font-bold tabular">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex h-28 items-end gap-2 rounded-lg border border-[#e5e7eb] p-3">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-[#1d4ed8]" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-xl bg-white p-3 pr-4 text-[#111827] shadow-xl ring-1 ring-black/5">
        <span className="grid size-9 place-items-center rounded-full bg-[#dcfce7] text-[#15803d]">
          <Smartphone className="size-4" />
        </span>
        <div className="text-sm">
          <p className="font-semibold">2 × VIP paid</p>
          <p className="text-xs text-[#6b7280]">via M-Pesa · just now</p>
        </div>
      </div>
      <div className="absolute -right-4 -top-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-[#111827] shadow-xl ring-1 ring-black/5">
        <CalendarClock className="size-4 text-[#1d4ed8]" />
        <span className="font-medium">Early bird ends Friday</span>
      </div>
    </div>
  );
}
