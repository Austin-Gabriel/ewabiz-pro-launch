# STRUCTURE

This file documents the domain-folder structure of the Ewà Biz project for AI tools and human collaborators. It is a map, not a narrative — use it to decide where new code belongs.

`/src/routes/` is flat by TanStack Start convention. Route files are thin wrappers that import their UI from the relevant domain folder.

## Folders under /src

- `/src/assets` — Static image assets (logo marks, wordmarks) imported by UI components.
- `/src/auth` — Authentication shells, inputs, buttons, the Supabase-backed auth context, and signup-pending state used across login/signup/verify flows.
- `/src/bookings` — Placeholder domain folder for bookings features; no code yet.
- `/src/calendar` — Placeholder domain folder for calendar features; no code yet.
- `/src/clients` — Placeholder domain folder for clients features; no code yet.
- `/src/components` — Cross-domain shared UI: the EWA logo component and the shadcn/ui primitives under `ui/`.
- `/src/data` — Mock data fixtures (bookings, requests, stats) consumed by the live dashboard and other surfaces.
- `/src/dev-state` — Dev-only state toggle context and UI for flipping between pro states, densities, and themes during design/QA.
- `/src/disputes` — Placeholder domain folder for disputes features; no code yet.
- `/src/earnings` — Placeholder domain folder for earnings features; no code yet.
- `/src/home` — The state-aware home surface: shell, bottom tabs, live/pending/mid-onboarding states, and profile sheet.
- `/src/hooks` — Shared React hooks reused across domains (e.g. `use-mobile`).
- `/src/insights` — Placeholder domain folder for insights features; no code yet.
- `/src/integrations` — Third-party integration clients, currently the Supabase browser/server/admin clients, auth middleware, and generated types.
- `/src/lib` — App-wide pure utilities (e.g. `cn` class-name helper) with no domain ownership.
- `/src/messaging` — Placeholder domain folder for messaging features; no code yet.
- `/src/notifications` — Placeholder domain folder for notifications features; no code yet.
- `/src/onboarding` — The 14-step pro onboarding wizard: context, step router, shell, shared inputs, and per-step screens.
- `/src/onboarding-states` — Post-onboarding verification surfaces, currently the KYC capture flow (camera, context, shell, screens).
- `/src/profile` — Placeholder domain folder for profile features; no code yet.
- `/src/routes` — TanStack Start file-based route definitions; each file is a thin wrapper that imports its UI from a domain folder.
- `/src/services` — Placeholder domain folder for services features; no code yet.
- `/src/settings` — Placeholder domain folder for settings features; no code yet.
- `/src/styles` — Placeholder domain folder for additional style modules; the global stylesheet lives at `/src/styles.css`.
- `/src/support` — Placeholder domain folder for support features; no code yet.
- `/src/system` — Placeholder domain folder for system-level features; no code yet.

## Placement Rules

- New code goes in its domain folder.
- Shared folders (`/src/components`, `/src/hooks`, `/src/lib`) are for code used across 3+ domains only.
- Never create new top-level folders under `/src/` without confirmation.

## Maintenance

- Update this file only when a folder is added, renamed, or its purpose fundamentally changes.
- Do not update for routine file creation or moves within existing folders..
