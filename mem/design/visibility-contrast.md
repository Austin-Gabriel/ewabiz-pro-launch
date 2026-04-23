---
name: visibility-contrast
description: Every component must remain visible and legible in BOTH dark and light modes. Never hardcode mode-specific colors that don't have a counterpart on the opposite background.
type: design
---
**Rule:** No element may disappear, fade, or become hard to read when the app flips between dark and light mode. Every interactive control (toggles, buttons, inputs) MUST be visible regardless of state. Every text element MUST have strong contrast against its current surface.

**Common failure modes (all forbidden):**
1. Hardcoding `rgba(240,235,216,...)` (cream) for tints/backgrounds — invisible on cream light-mode page bg. Use the `surface` / `borderCol` tokens from `useHomeTheme()` instead, which already adapt.
2. Calling `useHomeTheme()` ABOVE `<CardTheme>` and passing `text` color into card children — the captured value is the page-level color (cream in dark mode), which disappears against the white card. **Always read theme INSIDE the CardTheme subtree** by extracting card body into its own sub-component.
3. Toggle / switch off-state tracks colored only for one mode. Off-state must be a tinted version of the INVERSE of the page bg so it reads as filled on either side. The thumb takes the page-bg color when off, navy when on.
4. shadcn primitives that default to `bg-input` for off-state — the input token is too pale in light mode. Override to a 30%-opacity navy/cream pair.

**How to apply:**
- Page-chrome surfaces (status bars, chips, progress tracks): use `surface` / `surfaceElevated` / `borderCol` from `useHomeTheme()`.
- Card surfaces: always white via `<CardTheme>`. Body content reading `text` / `borderCol` MUST live inside the CardTheme provider — extract into a sub-component if needed.
- Toggles: off-track = `isDark ? "rgba(240,235,216,0.22)" : "rgba(6,28,39,0.28)"`; thumb when off = page-bg color with a soft navy shadow.
- Body copy on cards: minimum opacity 0.7 (navy on white). Never go below 0.55.
- When in doubt, mentally flip light↔dark on a screen. If anything vanishes or fades to near-invisible, fix it.
