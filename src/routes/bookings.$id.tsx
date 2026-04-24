import { createFileRoute, useParams } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { BookingDetailPage } from "@/bookings/booking-detail-page";

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({ meta: [{ title: "Booking — Ewà Biz" }] }),
  component: BookingDetailRoute,
});

function BookingDetailRoute() {
  const { id } = useParams({ from: "/bookings/$id" });
  return (
    <RequireAuth>
      <BookingDetailPage bookingId={id} />
    </RequireAuth>
  );
}