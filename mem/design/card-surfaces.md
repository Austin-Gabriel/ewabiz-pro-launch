---
name: card-surfaces
description: Card backgrounds are pure white in BOTH light and dark mode, with navy text. Applies to every card on every screen (Home, Calendar, Earnings, Booking details, Profile, future screens).
type: design
---
**Rule:** Every card surface in the app is pure white (`#FFFFFF`) in both light and dark mode. Text on cards is always navy (`#061C27`). Border is `rgba(6,28,39,0.10)`. Shadow: `0 1px 2px rgba(6,28,39,0.06), 0 8px 24px -12px rgba(6,28,39,0.18)`.

**Why:** Strong, crisp contrast against either the dark navy bg or the cream bg makes cards feel like real physical objects on the page.

**How to apply:**
- For HomeShell-themed surfaces, wrap card content in `<CardTheme>` from `@/components/home/home-shell` and read `cardSurface` / `cardText` / `cardBorder` from `useHomeTheme()`. `CardTheme` re-exposes `text` as navy and `bg` as white so child components automatically inherit the right palette.
- For shadcn `<Card>` primitive: it's already configured to white + navy text by default — just use it.
- Light-mode page chrome (status bars, nav chips, progress tracks) stays cream/translucent — the rule is for **cards**, not all surfaces.
- Page backgrounds: navy in dark mode, cream in light mode (unchanged).
