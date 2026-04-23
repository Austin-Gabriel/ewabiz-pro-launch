---
name: folder-structure
description: Domain-folder layout under src/ for multi-team work. Routes stay flat in src/routes/ (TanStack constraint); each domain (auth, onboarding, onboarding-states/kyc, home, dev-state, bookings, calendar, clients, earnings, services, profile, messaging, notifications, settings, support, disputes, insights, system) owns its UI + hooks.
type: preference
---
**Rule:** Code is organized by domain folder under `src/`, not by technical type.

**Layout:**
- `src/routes/` — TanStack file-based routes. Stays flat. Each route is a thin wrapper that imports UI from a domain folder.
- `src/<domain>/` — UI, hooks, and domain-scoped utilities for that feature area. Existing: `auth`, `onboarding`, `onboarding-states/kyc`, `home`, `dev-state`. Placeholder (README only): `bookings`, `calendar`, `clients`, `earnings`, `services`, `profile`, `messaging`, `notifications`, `settings`, `support`, `disputes`, `insights`, `system`.
- `src/components/` — shared cross-domain UI (`ewa-logo`, shadcn `ui/`).
- `src/lib/` — shared utilities (`utils.ts`).
- `src/data/` — mock data fixtures.
- `src/styles/` + `src/styles.css` — brand tokens.

**Why:** Teams can own a domain end-to-end without cross-folder churn while respecting TanStack Start's file-based routing.

**How to apply:**
- New feature → create or extend `src/<domain>/`. Route file imports from there.
- Don't reintroduce `src/components/<feature>/` or `src/lib/<feature>-context.tsx`.
