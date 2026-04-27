---
name: orange-discipline
description: Warm orange (#FF823F) is reserved for the single most important action on a screen. Status uses green (#16A34A). Money-in-motion gets orange. Everything else is neutral navy/white/gray.
type: design
---
**Rule:** Warm orange (`#FF823F`) is the app's accent and is used for **exactly one thing per screen**: the single most important action OR the one piece of value that is currently *in motion* (money about to land, payout in-transit, countdown ring). Everything else is neutral.

**Tokens:**
- Orange (action / money-in-motion): `#FF823F`
- Orange soft (focus pill bg, in-transit pill bg): `rgba(255,130,63,0.14)`
- Orange deep (in-transit pill text on soft bg): `#B8531C`
- Success green (positive *settled* status — paid, completed, verified, "on pace"): `#16A34A` / `#15803D`
- Neutral text on cards: `#061C27` (navy) at varying opacities (1.0 / 0.7 / 0.55)
- Neutral chrome buttons: card surface + 1px navy/cream border, no fill

**Earnings application (canonical):**
- Earnings Home: Pending Payout amount is orange when > 0 — it's the one number "in motion." Settled totals stay navy.
- Payout History: only the **In-transit** pill is orange-soft. Paid pills green, Failed pills red.
- Payout Detail (failed): Retry CTA is orange-filled (the action).
- Payout Method: Change Account CTA is orange-filled (the action).
- Recent Earnings, Tax Documents, Payout Detail (paid): NO orange — purely informational/archival.

**Forbidden:**
- Orange on tertiary links ("Details →", "Go online →", "Message client") — use navy at 100% weight 600 instead
- Orange on settled inline status text ("on pace for $X") — use green
- Orange on category eyebrows / labels — keep them muted neutral
- Orange on more than one anchor per screen
- Orange on Paid pills, completed bookings, archival rows
- Mixing action types in the same row (e.g. orange Navigate next to outlined Message + Call is fine because Message/Call are equal-weight secondaries; orange Accept next to orange Decline is NOT fine)

**Hierarchy comes from weight + size, not color.** Big bold tabular numbers for what matters, tiny uppercase labels for categories, navy at 0.65 opacity for supporting copy.

**Buttons:**
- Primary: filled `#FF823F` background, navy `#061C27` text, full-width on mobile, weight 600
- Secondary: transparent fill, 1px border in current text color at low opacity, navy text
- Tertiary: text-only link, navy weight 600 with `→` affix, no underline

**Vibe:** Apple-like calm. White cards on deep navy bg. Generous spacing, rounded 16-20px corners. Premium and quiet — if it starts to look like a generic SaaS template, pull it back toward white-card-on-navy with one orange anchor.
