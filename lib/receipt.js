import { createHash } from "node:crypto";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonical(child)]));
  return value;
}

export function sealReceipt(payload) {
  const hash = createHash("sha256").update(JSON.stringify(canonical(payload))).digest("hex");
  return { ...payload, integrity: { algorithm: "sha256", hash } };
}
