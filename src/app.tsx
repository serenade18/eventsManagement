import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { PublicLayout } from "@/components/layout/public-layout";
import { ConsoleLayout, PageSkeleton, RequireRole } from "@/components/layout/console-layout";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

import HomePage from "@/pages/public/home";
import EventsPage from "@/pages/public/events";
import EventDetailPage from "@/pages/public/event-detail";
import CheckoutPage from "@/pages/public/checkout";
import PaymentPage from "@/pages/public/payment";
import OrderPage from "@/pages/public/order";
import TicketPage from "@/pages/public/ticket";
import FindTicketPage from "@/pages/public/find-ticket";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import NotFoundPage from "@/pages/not-found";

// Console routes (and the chart library) load on demand (spec §14).
const DashboardPage = lazy(() => import("@/pages/console/dashboard"));
const MyEventsPage = lazy(() => import("@/pages/console/my-events"));
const EventFormPage = lazy(() => import("@/pages/console/event-form"));
const ConsoleEventPage = lazy(() => import("@/pages/console/event-overview"));
const TicketsPage = lazy(() => import("@/pages/console/tickets"));
const ProfilePage = lazy(() => import("@/pages/console/profile"));
const PasswordPage = lazy(() => import("@/pages/console/password"));
const UsersPage = lazy(() => import("@/pages/admin/users"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => count < 1 && !(err && typeof err === "object" && "status" in err && Number(err.status) >= 400 && Number(err.status) < 500),
      refetchOnWindowFocus: false,
    },
  },
});

const ORG = ["organizer", "admin"] as const;

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

function ConsoleRoutes() {
  return (
    <Routes>
      <Route element={<ConsoleLayout />}>
        <Route index element={<Lazy><RequireRole roles={[...ORG]}><DashboardPage /></RequireRole></Lazy>} />
        <Route path="events" element={<Lazy><RequireRole roles={[...ORG]}><MyEventsPage /></RequireRole></Lazy>} />
        <Route path="events/new" element={<Lazy><RequireRole roles={[...ORG]}><EventFormPage /></RequireRole></Lazy>} />
        <Route path="events/:id" element={<Lazy><RequireRole roles={[...ORG]}><ConsoleEventPage /></RequireRole></Lazy>} />
        <Route path="events/:id/edit" element={<Lazy><RequireRole roles={[...ORG]}><EventFormPage /></RequireRole></Lazy>} />
        <Route path="tickets" element={<Lazy><RequireRole roles={[...ORG]}><TicketsPage /></RequireRole></Lazy>} />
        <Route path="users" element={<Lazy><RequireRole roles={["admin"]}><UsersPage /></RequireRole></Lazy>} />
        <Route path="profile" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="password" element={<Lazy><PasswordPage /></Lazy>} />
        <Route path="*" element={<NotFoundPage console />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <ScrollToTop />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:id" element={<EventDetailPage />} />
                <Route path="events/:id/checkout" element={<CheckoutPage />} />
                <Route path="orders/:reference" element={<OrderPage />} />
                <Route path="orders/:reference/pay" element={<PaymentPage />} />
                <Route path="tickets/:ticketNumber" element={<TicketPage />} />
                <Route path="tickets/:ticketNumber/download" element={<TicketPage download />} />
                <Route path="find-ticket" element={<FindTicketPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="console/*" element={<ConsoleRoutes />} />
            </Routes>
            <Toaster position="top-center" richColors closeButton />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
