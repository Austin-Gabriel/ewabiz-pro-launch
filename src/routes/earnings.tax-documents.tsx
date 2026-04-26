import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/require-auth";
import { TaxDocumentsPage } from "@/earnings/tax-documents-page";

export const Route = createFileRoute("/earnings/tax-documents")({
  head: () => ({ meta: [{ title: "Tax documents — Ewà Biz" }] }),
  component: () => (
    <RequireAuth>
      <TaxDocumentsPage />
    </RequireAuth>
  ),
});