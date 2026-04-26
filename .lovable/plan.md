## Earnings home — two adjustments

### 1. Remove the bar chart
- Delete the `<ChartCard />` render from `EarningsHomePage` (line 93 of `src/earnings/earnings-home-page.tsx`).
- Remove the now-unused `ChartCard`, `CardBodyForChart`, `ChartTooltip`, `labelFor`, and `EmptyChart` helpers.
- Drop the now-unused imports: `Bar`, `BarChart`, `Cell`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis` from recharts, and `ChartBucket` / `bucketsFor` from mock-earnings.
- Keep the `<PeriodToggle />` — it still drives Top services and Tips.

### 2. Convert top summary into a horizontal KPI strip
Replace the current vertically stacked `ContextSummaryCard` (three sections separated by dividers) with a single row of three KPI cards, sitting side-by-side like the previous balance trio but using the new content.

Layout (mobile, 390px wide):

```text
┌───────────┬───────────┬───────────┐
│ THIS WEEK │ UPCOMING  │ NEXT      │
│           │           │ PAYOUT    │
│ $401      │ $590      │ Friday    │
│ ↓ 35%     │ 3 appts   │ $360      │
│ vs last wk│ next 7 d  │ Arrives   │
│           │           │ May 1     │
└───────────┴───────────┴───────────┘
```

Each KPI card:
- White surface, navy text, same border / shadow / radius as existing balance tiles.
- Eyebrow label (uppercase, 10px, 0.6 opacity navy): "This week", "Upcoming", "Next payout".
- Headline value (18–20px semibold, tabular nums): the dollar amount or weekday.
- One-line sub: for This week the trend (↑/↓ N% vs last week, green/red, kept exactly as the user likes); for Upcoming the appointment count and "next 7 days"; for Next payout the dollar amount + arrival date.
- If Upcoming revenue is $0 the tile collapses to a muted "No upcoming" line (instead of hiding, so the 3-column grid stays visually balanced).
- If there is no in-transit payout the Next payout tile shows "—" muted.

### Files touched
- `src/earnings/earnings-home-page.tsx` — remove ChartCard + chart helpers/imports; rewrite `ContextSummaryCard` and its sub-components (`SummarySection`, `SummaryHeadline`, `SummaryLine`, `Divider`) to render a horizontal `grid-cols-3` of compact KPI tiles.

No data-layer changes — `thisWeekStats`, `upcomingStats`, `nextPayoutStats` already return everything needed.
