import { CalendarPlus, Link2, Navigation, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/api/types";
import { buildIcs, downloadFile } from "@/lib/format";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z" />
    </svg>
  );
}

/** Calendar, directions and sharing for an event. */
export function EventActions({ event }: { event: Event }) {
  const url = `${window.location.origin}/events/${event.id}`;
  const shareText = `${event.title} on HostMe: ${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };
  const nativeShare = async () => {
    try {
      await navigator.share({ title: event.title, url });
    } catch {
      /* dismissed */
    }
  };
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          downloadFile(
            `${event.title.replace(/[^\w]+/g, "-").toLowerCase()}.ics`,
            buildIcs({
              title: event.title,
              date: event.date,
              time: event.time,
              location: event.venue,
              description: url,
            }),
            "text/calendar",
          )
        }
      >
        <CalendarPlus /> Add to calendar
      </Button>
      <Button asChild variant="outline" size="sm">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation /> Directions
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on WhatsApp"
        >
          <WhatsAppIcon /> WhatsApp
        </a>
      </Button>
      {canShare ? (
        <Button variant="outline" size="sm" onClick={nativeShare}>
          <Share2 /> Share
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={copy}>
          <Link2 /> Copy link
        </Button>
      )}
    </div>
  );
}
