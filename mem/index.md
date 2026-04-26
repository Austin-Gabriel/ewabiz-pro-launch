# Project Memory

## Core
Cards: pure WHITE bg + navy (#061C27) text in BOTH light and dark mode. Apply on every screen. Page bg stays navy/cream.
Orange (#FF823F) is reserved for the SINGLE most important action per screen (primary CTA + active countdown ring only). Status uses green (#16A34A). Tertiary links + status eyebrows are neutral navy. Never two orange elements competing on one screen.
Bagel orange is mode-INDEPENDENT — never tinted by light/dark mode.
Time format: on-the-hour → "1 PM" (no ":00"); off-the-hour → "1:30 PM". Never leading zeros, never ":00".
Two-letter monograms always (cream fill, deep-bagel initials, semibold). Never single-letter.
Home is two top-level variants in src/home/state-home.tsx (StateHome): Offline = day overview (no/one/multiple/full sub-states); Online = ready surface. Inter only, white cards. Mode toggle animates 280ms. Schedule button only shown when offline.
Never use middle-dot ( · ) to compress multiple data points onto one line. Each meaningful value gets its own line. White space is a feature.

## Memories
- [Card surfaces](mem://design/card-surfaces) — White cards + navy text in both modes
- [Orange discipline](mem://design/orange-discipline) — One orange element per screen
- [Visibility & contrast](mem://design/visibility-contrast) — Use theme tokens, not hardcoded cream rgba; read theme INSIDE CardTheme
- [Light/dark audit](mem://design/light-dark-audit) — Confirmed clean; system invariants documented
- [Folder structure](mem://architecture/folder-structure) — Domain folder rules
- [No dot separators](mem://design/no-dot-separators) — Stack data instead of joining with ` · `
