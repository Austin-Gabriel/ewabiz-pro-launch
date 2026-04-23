# Project Memory

## Core
Cards: pure WHITE bg + navy (#061C27) text in BOTH light and dark mode. Apply on every screen, current and future. Page bg stays navy/cream.
Code lives in domain folders under src/ (auth, onboarding, home, dev-state, bookings, etc.). Routes stay flat in src/routes/. Cross-domain shared UI in src/components/, mock data in src/data/.
Every component must remain visible & legible in BOTH dark and light mode — no hardcoded mode-specific colors, toggles always show their state, text always has contrast against current surface.
Dev panel drives Home via DevState dimensions: mode (offline/online), dayContext (none/one/multiple/full), onlineStatus (idle/incoming/active). New mock datasets live in src/data/mock-data.ts (DAY_NONE/ONE/MULTIPLE/FULL, ONLINE_IDLE). Lifecycle states (incoming/active) are placeholders pending lifecycle pass.
Home is two top-level variants in src/home/state-home.tsx (StateHome): Offline = day overview (no/one/multiple/full sub-states); Online = ready surface (idle = pulsing listening dot + "You're online", incoming/active = labeled placeholders). No greetings, no "Waiting on you" copy. Inter only, white cards on dark, cream-elevated on light. Mode toggle animates 280ms. Schedule button only shown when offline.

## Memories
- [Card surfaces](mem://design/card-surfaces) — White cards w/ navy text in both themes; use `<CardTheme>` from home-shell or shadcn Card; chrome stays translucent
- [Folder structure](mem://architecture/folder-structure) — Domain folders under src/; routes stay flat; placeholder domains have README only
- [Visibility & contrast](mem://design/visibility-contrast) — Use theme tokens not hardcoded cream rgba; read theme INSIDE CardTheme; toggle off-state must be visible on both bgs
