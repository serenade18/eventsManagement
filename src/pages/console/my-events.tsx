import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { EventBadges } from "@/components/common/status";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Poster } from "@/components/events/poster";
import { deleteEvent } from "@/lib/api/endpoints";
import { myEventsQuery, qk } from "@/lib/api/queries";
import type { Event } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { bySoonest } from "@/lib/events";
import { eventWhen, isPast } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

export default function MyEventsPage() {
  const { user } = useAuth();
  const admin = user?.user_type === "admin";
  useTitle(admin ? "All events" : "My events");
  const qc = useQueryClient();
  const q = useQuery(myEventsQuery());
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Event | null>(null);

  const list = useMemo(() => {
    if (!q.data) return [];
    const s = search.trim().toLowerCase();
    return q.data
      .filter((e) => (tab === "past" ? isPast(e) : !isPast(e)))
      .filter((e) => !s || e.title.toLowerCase().includes(s))
      .sort((a, b) => (tab === "past" ? bySoonest(b, a) : bySoonest(a, b)));
  }, [q.data, tab, search]);

  return (
    <>
      <PageHeader
        title={admin ? "All events" : "My events"}
        description={admin ? "Every event on HostMe." : "Create, edit and track your events."}
        actions={
          <Button asChild>
            <Link to="/console/events/new">
              <Plus /> Create event
            </Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <label htmlFor="ev-search" className="sr-only">
            Search by title
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="ev-search"
            type="search"
            placeholder="Search by title"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {q.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="No events yet"
          description="Create your first event to start selling tickets."
          action={
            <Button asChild>
              <Link to="/console/events/new">
                <Plus /> Create event
              </Link>
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title={
            search
              ? "No events match your search"
              : tab === "past"
                ? "No past events"
                : "No upcoming events"
          }
          description={search ? "Try a different title." : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((e) => (
            <EventRow key={e.id} event={e} onDelete={() => setToDelete(e)} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete "${toDelete?.title ?? ""}"?`}
        description="This removes the event and its ticket tiers. Events that already have ticket orders can't be deleted."
        confirmLabel="Delete event"
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteEvent(toDelete.id);
          toast.success("Event deleted");
          await qc.invalidateQueries({ queryKey: qk.myEvents });
          void qc.invalidateQueries({ queryKey: qk.publicEvents });
        }}
      />
    </>
  );
}

function EventRow({ event: e, onDelete }: { event: Event; onDelete: () => void }) {
  const when = eventWhen(e.date, e.time);
  return (
    <li className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3 sm:p-4">
      <Poster
        src={e.poster}
        title={e.title}
        ratio="aspect-square"
        className="w-16 shrink-0 rounded-lg sm:w-20"
      />
      <div className="min-w-0 flex-1">
        <Link to={`/console/events/${e.id}`} className="line-clamp-1 font-semibold hover:underline">
          {e.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden /> {when.day} · {when.time}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden />{" "}
            <span className="truncate">{e.venue}</span>
          </span>
          <span>
            {e.ticket_types.length} {e.ticket_types.length === 1 ? "tier" : "tiers"}
          </span>
        </p>
        <div className="mt-2">
          <EventBadges event={e} />
        </div>
      </div>
      <div className="hidden gap-1 md:flex">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/console/events/${e.id}`}>
            <Eye /> View
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/console/events/${e.id}/edit`}>
            <Pencil /> Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:text-danger"
          onClick={onDelete}
        >
          <Trash2 /> Delete
        </Button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={`Actions for ${e.title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/console/events/${e.id}`}>
              <Eye /> View
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/console/events/${e.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-danger focus:text-danger" onSelect={onDelete}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
