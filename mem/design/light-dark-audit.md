---
name: light-dark-audit
description: Audit confirmation — every surface flips correctly between light and dark mode via theme tokens. No hardcoded mode-specific colors except inside CardTheme (intentional white/navy).
type: design
---
**Audit result (Apr 2026):** All surfaces render correctly in BOTH modes.

**System invariants to keep:**
- Page chrome reads `text` / `bg` / `surface` / `surfaceElevated` / `borderCol` / `borderSoft` from `useHomeTheme()` — these flip per mode (cream/navy).
- Card surfaces are PURE WHITE in both modes via `<CardTheme>`; child components inside CardTheme automatically read navy text + white bg from the same hook.
- Bagel orange `#FF823F` is mode-INDEPENDENT — full saturation in both modes. Never tinted, never alpha-shifted by mode.
- Auth, Onboarding, KYC shells run their own `isDark` state but use the same cream/navy palette and bagel accent.
- The only hardcoded `#061C27` / `#FFFFFF` references outside theme tokens are inside `BookingRowCard` (navy text on always-white card) — intentional and locked by mem://design/card-surfaces.

**Forbidden:**
- Tailwind palette utilities (`bg-white`, `bg-gray-*`, `text-black`, `text-slate-*`, etc.) for any non-card surface. Use theme tokens.
- Hardcoded cream/navy in page-chrome contexts (status bars, chips, progress tracks). Use the hook tokens.
- Tinting bagel by mode. The accent is the same on both backgrounds.
