import { localClient } from "@/api/localClient";

const maxSuffix = (rows, field) =>
  rows.reduce((m, r) => {
    const n = parseInt(String(r[field] || "").split("-").pop(), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);

// Demo identifiers, e.g. ULP-2026-0001 / CMP-2026-0001
export async function nextNumber(entity, field, prefix) {
  const rows = await localClient.entities[entity].list("-created_date", 500);
  return `${prefix}-${new Date().getFullYear()}-${String(maxSuffix(rows, field) + 1).padStart(4, "0")}`;
}

// Demo ULPIN, e.g. DEMO-ULPIN-000001 (never an official ULPIN)
export async function nextDemoUlpin() {
  const rows = await localClient.entities.PropertyStatus.list("-created_date", 500);
  return `DEMO-ULPIN-${String(maxSuffix(rows, "ulpin") + 1).padStart(6, "0")}`;
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";