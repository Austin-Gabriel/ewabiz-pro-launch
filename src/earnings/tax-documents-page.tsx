import { useMemo } from "react";
import {
  earningsForDensity,
  formatMoney,
  type EarningEvent,
} from "@/data/mock-earnings";
import { useDevState } from "@/dev-state/dev-state-context";
import {
  EARNINGS_NAVY,
  EARNINGS_UI,
  EarningsCard,
  EarningsCardEyebrow,
  EarningsSubShell,
} from "./earnings-shell";
import { taxYearToDate } from "./earnings-aggregates";
import { downloadCsv } from "./csv-export";

const NAVY = EARNINGS_NAVY;
const UI = EARNINGS_UI;

/**
 * Tax Documents — a quiet annual summary surface. Lists 1099-K-style
 * documents per tax year. Tapping a row generates a stub PDF on the fly
 * (so prototype downloads behave like real ones) using the year's actual
 * earnings totals from mock-earnings. The 1099 threshold ($600 IRS minimum)
 * is acknowledged: years below it surface a calm explainer instead of a
 * download row.
 */

interface YearSummary {
  year: number;
  gross: number;
  net: number;
  bookings: number;
}

function densityFromDev(d: ReturnType<typeof useDevState>["state"]["dataDensity"]) {
  if (d === "empty") return "none" as const;
  if (d === "sparse") return "sparse" as const;
  return "rich" as const;
}

function summarizeByYear(events: EarningEvent[]): YearSummary[] {
  const map = new Map<number, YearSummary>();
  for (const e of events) {
    const y = e.date.getFullYear();
    if (!map.has(y)) map.set(y, { year: y, gross: 0, net: 0, bookings: 0 });
    const s = map.get(y)!;
    s.gross += e.gross + e.tip;
    s.net += e.net;
    s.bookings += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.year - a.year);
}

const THRESHOLD = 600;

export function TaxDocumentsPage() {
  const { state: dev } = useDevState();
  const events = useMemo(
    () => earningsForDensity(densityFromDev(dev.dataDensity)),
    [dev.dataDensity],
  );
  const ytd = useMemo(() => taxYearToDate(events), [events]);
  const years = useMemo(() => {
    const all = summarizeByYear(events);
    switch (dev.taxDocs) {
      case "none":
        return [];
      case "current-year": {
        const thisYear = new Date().getFullYear();
        // Prefer real current-year row; otherwise synthesize a minimal one
        // so the dev state is demonstrable even on empty datasets.
        const found = all.find((y) => y.year === thisYear);
        if (found) return [found];
        return [{ year: thisYear, gross: 4820, net: 4099, bookings: 38 }];
      }
      case "multi-year": {
        if (all.length >= 2) return all;
        // Synthesize a 3-year history when mock data is too thin.
        const thisYear = new Date().getFullYear();
        return [
          { year: thisYear, gross: 6240, net: 5304, bookings: 47 },
          { year: thisYear - 1, gross: 18420, net: 15657, bookings: 142 },
          { year: thisYear - 2, gross: 12180, net: 10353, bookings: 96 },
        ];
      }
      case "auto":
      default:
        return all;
    }
  }, [events, dev.taxDocs]);

  return (
    <EarningsSubShell title="Tax documents">
      <YearToDateCard ytd={ytd} />
      {years.length === 0 ? (
        <EmptyState />
      ) : (
        <EarningsCard>
          <div className="flex flex-col">
            {years.map((y, i) => (
              <YearRow key={y.year} summary={y} divider={i < years.length - 1} />
            ))}
          </div>
        </EarningsCard>
      )}

      <OtherReportsCard events={events} />

      <EarningsCard>
        <div style={{ padding: 16, fontFamily: UI }}>
          <EarningsCardEyebrow>About these documents</EarningsCardEyebrow>
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: NAVY,
              opacity: 0.75,
              lineHeight: 1.6,
            }}
          >
            We issue a 1099-K each January summarizing the prior year's gross earnings processed
            through Ewà. You'll only receive one if your gross processing volume exceeded the IRS
            reporting threshold for that year.
          </div>
        </div>
      </EarningsCard>
    </EarningsSubShell>
  );
}

function YearToDateCard({ ytd }: { ytd: ReturnType<typeof taxYearToDate> }) {
  const statusLabel =
    ytd.status === "below-threshold"
      ? "Below 1099 threshold"
      : ytd.status === "eligible"
        ? "1099 issued"
        : "Estimated 1099 in January";
  const statusTone = ytd.status === "below-threshold" ? "muted" : "orange";
  return (
    <EarningsCard>
      <div style={{ padding: 18, fontFamily: UI }}>
        <div className="flex items-center gap-2">
          <EarningsCardEyebrow>{ytd.year} year-to-date</EarningsCardEyebrow>
          <StatusPill label={statusLabel} tone={statusTone} />
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 30,
            fontWeight: 600,
            color: NAVY,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          {formatMoney(ytd.gross)}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: NAVY, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
          gross processed
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <YtdStat label="Net to you" value={formatMoney(ytd.net)} />
          <YtdStat label="Bookings" value={String(ytd.bookings)} />
        </div>
      </div>
    </EarningsCard>
  );
}

function YtdStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        backgroundColor: "rgba(6,28,39,0.04)",
        fontFamily: UI,
        color: NAVY,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.55, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "muted" | "orange" }) {
  const palette =
    tone === "muted"
      ? { bg: "rgba(6,28,39,0.08)", fg: NAVY }
      : { bg: "rgba(255,130,63,0.14)", fg: "#7A3A12" };
  return (
    <span
      style={{
        fontFamily: UI,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 999,
        backgroundColor: palette.bg,
        color: palette.fg,
      }}
    >
      {label}
    </span>
  );
}

function OtherReportsCard({ events }: { events: EarningEvent[] }) {
  const exportAnnual = () => {
    const year = new Date().getFullYear();
    const inYear = events.filter((e) => e.date.getFullYear() === year);
    const rows: (string | number)[][] = [
      ["Date", "Client", "Service", "Gross", "Tip", "Fee", "Net"],
      ...inYear.map((e) => [
        e.date.toISOString().slice(0, 10),
        e.clientLabel,
        e.service,
        e.gross,
        e.tip,
        e.fee,
        e.net,
      ]),
    ];
    downloadCsv(`Ewa-annual-${year}.csv`, rows);
  };
  const exportQuarterly = () => {
    const year = new Date().getFullYear();
    const buckets = new Map<string, { gross: number; net: number; bookings: number }>();
    for (const e of events) {
      if (e.date.getFullYear() !== year) continue;
      const q = Math.floor(e.date.getMonth() / 3) + 1;
      const key = `Q${q}`;
      if (!buckets.has(key)) buckets.set(key, { gross: 0, net: 0, bookings: 0 });
      const b = buckets.get(key)!;
      b.gross += e.gross + e.tip;
      b.net += e.net;
      b.bookings += 1;
    }
    const rows: (string | number)[][] = [
      ["Quarter", "Gross", "Net", "Bookings"],
      ...["Q1", "Q2", "Q3", "Q4"].map((q) => {
        const b = buckets.get(q) ?? { gross: 0, net: 0, bookings: 0 };
        return [q, b.gross, b.net, b.bookings];
      }),
    ];
    downloadCsv(`Ewa-quarterly-${year}.csv`, rows);
  };
  const rows = [
    { label: "Annual summary", sub: "All bookings, this year", action: exportAnnual, format: "CSV" },
    { label: "Quarterly breakdown", sub: "Gross & net per quarter", action: exportQuarterly, format: "CSV" },
  ];
  return (
    <EarningsCard>
      <div style={{ padding: "16px 16px 8px", fontFamily: UI }}>
        <EarningsCardEyebrow>Other reports</EarningsCardEyebrow>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => (
          <button
            key={r.label}
            type="button"
            onClick={r.action}
            className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
            style={{
              padding: "12px 16px",
              borderTop: i === 0 ? "1px solid rgba(6,28,39,0.06)" : "1px solid rgba(6,28,39,0.06)",
              fontFamily: UI,
              textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{r.label}</div>
              <div style={{ marginTop: 2, fontSize: 12, color: NAVY, opacity: 0.6 }}>{r.sub}</div>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: NAVY,
                opacity: 0.55,
                padding: "3px 7px",
                borderRadius: 999,
                border: "1px solid rgba(6,28,39,0.15)",
              }}
            >
              {r.format}
            </span>
          </button>
        ))}
      </div>
    </EarningsCard>
  );
}

function YearRow({ summary, divider }: { summary: YearSummary; divider: boolean }) {
  const eligible = summary.gross >= THRESHOLD;
  return (
    <button
      type="button"
      disabled={!eligible}
      onClick={() => downloadStub1099(summary)}
      className="flex items-center justify-between transition-colors active:bg-black/[0.03]"
      style={{
        padding: "14px 16px",
        borderBottom: divider ? "1px solid rgba(6,28,39,0.08)" : "none",
        fontFamily: UI,
        textAlign: "left",
        cursor: eligible ? "pointer" : "default",
        opacity: eligible ? 1 : 0.55,
      }}
    >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
            {summary.year} 1099-K
          </div>
          {eligible ? (
            <>
              <div
                style={{
                  marginTop: 3,
                  fontSize: 12,
                  color: NAVY,
                  opacity: 0.6,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(summary.gross)} gross
              </div>
              <div
                style={{
                  marginTop: 1,
                  fontSize: 12,
                  color: NAVY,
                  opacity: 0.6,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {summary.bookings} {summary.bookings === 1 ? "booking" : "bookings"}
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                color: NAVY,
                opacity: 0.6,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Below reporting threshold ({formatMoney(THRESHOLD)})
            </div>
          )}
        </div>
      {eligible ? <DownloadGlyph /> : null}
    </button>
  );
}

function DownloadGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={NAVY}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.5, marginLeft: 12, flexShrink: 0 }}
    >
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function EmptyState() {
  return (
    <EarningsCard>
      <div style={{ padding: "44px 16px", textAlign: "center", fontFamily: UI }}>
        <EarningsCardEyebrow>No documents yet</EarningsCardEyebrow>
        <div style={{ marginTop: 8, fontSize: 14, color: NAVY, opacity: 0.7 }}>
          Your first 1099-K will appear here in January after your first qualifying tax year.
        </div>
      </div>
    </EarningsCard>
  );
}

/* ---------- Stub PDF generation ----------
 *
 * Builds a minimal, valid single-page PDF in pure JS — no library dependency.
 * Just enough structure for the browser to render and download. Demonstrates
 * that downloads are real, not faked toasts.
 */

function downloadStub1099(summary: YearSummary) {
  const lines = [
    `Ewa, Inc.`,
    ``,
    `Form 1099-K (Stub)`,
    `Tax Year: ${summary.year}`,
    ``,
    `Gross processing volume: ${formatMoney(summary.gross)}`,
    `Net to professional:    ${formatMoney(summary.net)}`,
    `Number of transactions:  ${summary.bookings}`,
    ``,
    `This is a prototype document. Final 1099-K forms`,
    `are issued each January through your account.`,
  ];
  const blob = new Blob([buildSimplePdf(lines)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ewa-1099K-${summary.year}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildSimplePdf(lines: string[]): string {
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const startY = 760;
  const lineHeight = 18;
  const textOps = lines
    .map((l, i) => `BT /F1 12 Tf 72 ${startY - i * lineHeight} Td (${escape(l)}) Tj ET`)
    .join("\n");
  const content = `${textOps}\n`;
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  );
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${off.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}