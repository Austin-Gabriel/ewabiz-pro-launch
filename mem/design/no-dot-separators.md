---
name: no-dot-separators
description: Never use middle-dot ( · ) separators to compress multiple data points onto one line. Each meaningful datum gets its own line. Applies app-wide.
type: preference
---
**Rule:** Do NOT use middle dots ( · ) to compress two or more meaningful pieces of information onto a single line. If both pieces are worth showing, give each its own line.

**Why:** White space is a feature. Dot-compressed lines read as visual noise and hide structure. Stacking values makes scanning faster.

**Examples:**
- ❌ `100% tipped · avg $19`
- ✅ Two lines: `100% tipped` then `Avg $19`
- ❌ `Apr 27 · 2:30 PM`
- ✅ `Apr 27` over `2:30 PM`, OR `Apr 27 at 2:30 PM`
- ❌ `$401 · 3 bookings · avg $134`
- ✅ Stack each as its own line / sub-row.
- ❌ KPI tile sub: `3 appts · next 7 days`
- ✅ KPI tile sub: stack `3 appts` over `Next 7 days` (sub can be a string[] of lines)

**How to apply:**
- Audit any string template using ` · ` and split into stacked lines / sub-rows.
- Acceptable only inside breadcrumb-like UI (e.g. nav trails) where the pattern is universal — NOT for data summaries.
- Time + date in a single inline metadata line is also discouraged; prefer stacking, or use a real connector word ("at", "—") instead of a middle dot.
- For tight status badges where stacking would break the layout (e.g. "In Progress — 12 min"), use an em dash with surrounding spaces, NEVER a middle dot.
- When designing a sub-line component, accept `string | string[]` so callers can naturally pass multiple lines.
