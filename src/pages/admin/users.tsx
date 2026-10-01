import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/states";
import { Pager, usePaged } from "@/components/console/pager";
import { listUsers } from "@/lib/api/endpoints";
import { qk } from "@/lib/api/queries";
import { shortDate } from "@/lib/format";
import { useTitle } from "@/hooks/use-title";

const ROLE_VARIANT = { admin: "solid", organizer: "default", sponsor: "info" } as const;

export default function UsersPage() {
  useTitle("Users");
  const navigate = useNavigate();
  const q = useQuery({ queryKey: qk.users, queryFn: listUsers });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? [])
      .filter((u) => role === "all" || u.user_type === role)
      .filter(
        (u) =>
          !s ||
          [u.name, u.email, u.phone, u.organization].some((v) => v?.toLowerCase().includes(s)),
      )
      .sort((a, b) => (b.added_on ?? "").localeCompare(a.added_on ?? ""));
  }, [q.data, search, role]);
  const paged = usePaged(rows);

  return (
    <>
      <PageHeader title="Users" description="Everyone with a MyEvents account." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <label htmlFor="u-search" className="sr-only">
            Search users
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="u-search"
            type="search"
            placeholder="Search name, email, phone…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="organizer">Organizers</SelectItem>
            <SelectItem value="sponsor">Sponsors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {q.isPending ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon={<Users />} title={q.data.length ? "No users match" : "No users yet"} />
      ) : (
        <div className="rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="pr-5">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.slice.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("a"))
                        navigate(`/console/users/${u.id}`);
                    }}
                  >
                    <TableCell className="pl-5 font-medium">
                      <Link
                        to={`/console/users/${u.id}`}
                        className="hover:text-brand hover:underline"
                      >
                        {u.name}
                      </Link>
                      {u.organization && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {u.organization}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="tabular">{u.phone}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[u.user_type]} className="capitalize">
                        {u.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-5">
                      {shortDate(u.added_on)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager {...paged} />
        </div>
      )}
    </>
  );
}
