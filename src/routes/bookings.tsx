import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { BookingsPage, type BookingsTab } from "@/bookings/bookings-page";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Ewà Biz" }] }),
  validateSearch: (search: Record<string, unknown>): { tab?: BookingsTab } => {
    const t = search.tab;
    if (t === "upcoming" || t === "in-progress" || t === "history") {
      return { tab: t };
    }
    return {};
  },
  component: BookingsRoute,
});

function BookingsRoute() {
  return (
    <RequireAuth>
      <BookingsRouteInner />
    </RequireAuth>
  );
}

function BookingsRouteInner() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const active: BookingsTab = tab ?? "upcoming";

  // `/bookings/$id` is a child route of `/bookings`. When a child is active,
  // render the <Outlet /> so the detail page appears instead of the list.
  // Normalize trailing slash so `/bookings/` still counts as the root.
  const path = location.pathname.replace(/\/+$/, "");
  const isRoot = path === "/bookings";
  if (!isRoot) {
    return <Outlet />;
  }

  return (
    <BookingsPage
      tab={active}
      onTabChange={(next) =>
        navigate({ to: "/bookings", search: { tab: next }, replace: true })
      }
    />
  );
}