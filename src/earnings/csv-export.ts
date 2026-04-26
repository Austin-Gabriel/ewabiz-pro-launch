/**
 * Pure-JS CSV builder. Mirrors the in-memory PDF stub pattern used by the
 * tax-documents page so prototype "Export" buttons produce real downloadable
 * artifacts instead of toasts.
 */

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (cell: string | number) => {
    const s = String(cell ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
