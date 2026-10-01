import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";

export default function NotFoundPage({ console = false }: { console?: boolean }) {
  useTitle("Page not found");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
        <Compass className="size-8" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-1 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {console ? (
          <Button asChild>
            <Link to="/console">Back to console</Link>
          </Button>
        ) : (
          <>
            <Button asChild>
              <Link to="/events">Browse events</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/find-ticket">Find my ticket</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
