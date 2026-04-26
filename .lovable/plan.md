# Earnings, leveled up

The current Earnings tab does the basics — a hero, a chart, a pending card, and four link rows that drill into thin sub-pages. It reads as a stub. For a platform where pros measure their week in dollars, this surface should feel as deliberate as Stripe's dashboard and as personal as a banking app. Below is the upgrade.

## Guiding principles

1. **Money-first hierarchy.** Every screen leads with a number that matters, not a label.
2. **No dead-end sub-pages.** Each drill-in surface earns its scroll — totals, context, and at least one action.
3. **Receipts, not lists.** Rows always reconcile to a parent total visible on the same screen.
4. **Industrial calm.** No motivational copy. Banking-grade typography, tabular numerals, restrained orange.

---

## 1. Earnings Home — restructure

Today's home is a vertical pile of equal-weight cards ending in a generic link list. Restructure into three deliberate zones.

**Zone A — Money on the move (top)**
- Hero (kept) — period net + booking count.
- **New: Balance trio strip.** Three compact stat tiles in a single row:
  - **Available** — already paid out this period (green dot).
  - **In transit** — next payout amount + arrival date (orange dot).
  - **Pending** — unpaid completed bookings (navy dot).
  Tapping any tile deep-links: Available → Payout history, In transit → that payout's detail, Pending → Recent earnings filtered to pending.
- Period toggle stays directly under the hero.

**Zone B — Performance (middle)**
- Chart card (kept).
- Top services (kept) — but add a tiny sparkline per row showing 4-week trend.
- Tip summary (kept).

**Zone C — Operate (bottom)**
Replace the four-row link list with **two rich cards** instead of four flat rows:

- **Payouts card** — eyebrow "Payouts", shows next payout amount + arrival inline, plus a 3-row mini list of the most recent payouts with date and amount. Footer link: "See all payouts →" routes to /earnings/payouts.
- **Documents & banking card** — two stacked rows with icons:
  - "Tax documents · current year ready" → /earnings/tax-documents
  - "Payout method · Chase ••4821 · Verified" → /earnings/payout-method
  Status text is live (driven by dev-state axes).

The "How earnings work" disclosure stays at the very bottom — quiet, where it belongs.

---

## 2. Payout History — give it weight

Currently a flat list of dates and amounts with no context.

**Add a header summary card** above the list:
- "Paid this year" big number + booking count
- "Avg payout" + "Most recent" smaller, side-by-side
- Tiny 12-bar sparkline showing payout cadence

**Group rows by month** with sticky-style month headers ("April · $4,820 · 4 payouts"). Within each month, the existing row design stays but gets:
- A small bank chip on the right (••4821) only when it differs from the default account, otherwise hidden — reduces noise.
- Failed-payout rows get a subtle left border in red and a "Retry" inline action.

**Bottom of page**: "Export CSV" ghost button — generates a real CSV blob (same trick as the 1099 stub) so it feels real.

---

## 3. Payout Detail — already strong, two refinements

- Add a **timeline strip** at the top showing the lifecycle (Earned → Bundled → Sent → Landed) with the current state highlighted. Three dots and short labels — no big component.
- Move the "Retry payout" CTA into a sticky footer for failed payouts so it survives long booking lists.

---

## 4. Recent Earnings — turn the list into a register

Today: chip filters + flat list. It's fine but unmemorable.

**Add a search field** at the top (filter by client name or service). Mobile-keyboard-friendly, debounced.

**Group by day** with day headers that show the day's total: "Apr 22 · $540 · 3 bookings". This reframes the list as a daily register, which is how pros actually think about earnings.

**Each row** gets a tiny status dot (paid = green, pending = orange) before the client name, so the in-transit-vs-paid distinction is visible without tapping.

**Add a sticky summary footer** showing the running total of the currently filtered set, so changing chips/search makes the math feel responsive.

---

## 5. Tax Documents — make it feel like a vault

Today: list of years + a small explainer. Quiet but bare.

**Add a "Year-to-date" hero card** at the top:
- Big number: gross processed this calendar year
- Sub-row: net to you · bookings · projected 1099 status (Eligible / Below threshold / Will issue in January)

**Year list rows** get richer:
- Year + form name (kept)
- Right side: "Download PDF" inline + a secondary "Email to me" link
- Eligible years get a small navy "Issued" pill; pending years get "Estimated" in orange

**Add a "Need a different report?" card** at the bottom with three quiet rows:
- Annual summary (CSV)
- Quarterly breakdown (CSV)
- Monthly statement (PDF)
All generate stub artifacts via the same in-memory builder pattern already used for 1099.

---

## 6. Payout Method — small but meaningful adds

- Add a **"Recent payouts to this account" mini list** (last 3) so the page isn't just a static record.
- Add a **"Tax info" row** under Schedule that links to /earnings/tax-documents — closes the loop between banking and reporting.
- The "Pause payouts" button gets a confirmation sheet explaining what pausing does, instead of being a dead button.

---

## Technical notes

**No new routes.** All work happens inside the five existing earnings pages plus shared mock-data helpers.

**Files I'll touch:**
- `src/earnings/earnings-home-page.tsx` — restructure into 3 zones, new BalanceTrio + PayoutsCard + DocsBankingCard components, drop LinkRows.
- `src/earnings/payout-history-page.tsx` — add HeaderSummary, group-by-month, CSV export.
- `src/earnings/payout-detail-page.tsx` — add Timeline strip, sticky retry footer.
- `src/earnings/recent-earnings-page.tsx` — add SearchField, group-by-day, status dots, sticky footer.
- `src/earnings/tax-documents-page.tsx` — add YTD hero, richer year rows, "Other reports" card.
- `src/earnings/payout-method-page.tsx` — add recent-payouts mini list, tax-info row, pause confirmation sheet.

**Files I'll add:**
- `src/earnings/earnings-aggregates.ts` — small helper module for the new derived stats (YTD, available/in-transit/pending split, payout-month grouping). Keeps page components clean.
- `src/earnings/csv-export.ts` — pure-JS CSV builder mirroring the existing PDF stub pattern.

**No new dependencies, no new mock-data files.** Everything derives from `mock-earnings.ts` and `mock-payouts.ts`. All dev-state axes (`dataDensity`, `payoutState`, `pendingBalance`, `taxDocs`) continue to drive the new components — no axis is ignored.

**Voice/visual discipline:** uses existing `EarningsCard`, `EarningsCardEyebrow`, `NAVY`, `ORANGE`, tabular numerals. Orange stays reserved for money-in-motion (in-transit, pending CTAs). No new colors.
