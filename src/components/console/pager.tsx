import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Client-side pagination for long tables. Resets to page 1 when the list changes length. */
export function usePaged<T>(rows: T[], size = 25) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  useEffect(() => setPage(1), [rows.length]);
  const p = Math.min(page, pages);
  return {
    page: p,
    pages,
    setPage,
    slice: rows.slice((p - 1) * size, p * size),
    total: rows.length,
    size,
  };
}

export function Pager({
  page,
  pages,
  setPage,
  total,
  size,
}: {
  page: number;
  pages: number;
  setPage: (n: number) => void;
  total: number;
  size: number;
}) {
  if (pages <= 1) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm"
    >
      <span className="text-muted-foreground tabular">
        {from}–{to} of {total}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
