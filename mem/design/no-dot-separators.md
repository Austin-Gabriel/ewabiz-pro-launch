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
- ✅ `Apr 27` over `2:30 PM`, OR drop one if redundant
- ❌ `$401 · 3 bookings · avg $134`
- ✅ Stack each as its own line / sub-row.

**How to apply:**
- Audit any string template using ` · ` and split into stacked lines / sub-rows.
- Acceptable only inside breadcrumb-like UI (e.g. nav trails) where the pattern is universal — NOT for data summaries.
- Time + date in a single inline metadata line is also discouraged; prefer stacking.
