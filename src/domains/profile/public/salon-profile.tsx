import { useParams } from "@tanstack/react-router";

export function SalonProfilePage() {
  const params = useParams({ strict: false }) as { username?: string };
  const username = params.username ?? "";
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-2xl font-semibold">Salon: {username}</h1>
      <p className="mt-2 text-muted-foreground">Public salon profile coming soon.</p>
    </div>
  );
}