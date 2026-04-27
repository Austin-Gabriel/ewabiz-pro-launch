import type { ReactNode } from "react";
import type { DashboardTab } from "@/domains/profile/profile-types";

const TABS: DashboardTab[] = [
  "overview", "bookings", "calendar", "services", "team", "earnings", "reviews", "settings",
];

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isOwner?: boolean;
  children: ReactNode;
}

export function ProDashboard({ activeTab, onTabChange, children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold">Pro Dashboard</h1>
      </header>
      <nav className="flex gap-2 overflow-x-auto border-b border-border px-6 py-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${
              activeTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}