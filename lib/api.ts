const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) console.warn("NEXT_PUBLIC_API_BASE is not set");

export async function verifyPaperKey(words: string[]) {
  const res = await fetch(`${API_BASE}/verify_paper_key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words })
  });
  if (!res.ok) {
    const err = new Error("Verify failed") as any;
    err.status = res.status;
    throw err;
  }
  return res.json();
  // { valid, client_hash, is_active, jurisdiction, has_competent_professional_signoff }
}

export async function onboardClient(words: string[], jurisdiction = "uk") {
  const res = await fetch(`${API_BASE}/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words, jurisdiction })
  });
  if (!res.ok) throw new Error("Onboard failed");
  return res.json();
}

const ADMIN_API_KEY = "SOVEREIGN-VAULT-MASTER-KEY-2026";

export async function onboardCompany(company_name: string) {
  const res = await fetch(`${API_BASE}/onboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ADMIN_API_KEY,
    },
    body: JSON.stringify({ company_name }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("[onboard] failed:", res.status, body);
    throw new Error("Onboard failed");
  }
  return res.json();
}

export async function getArmSummary(hash: string) {
  const res = await fetch(`${API_BASE}/arm/summary/${hash}`);
  if (!res.ok) throw new Error("ARM summary failed");
  return res.json();
  // returns: total_eligible_gbp_from_audit, blocks_analysed, integrity_score,
  // eligible_count, ineligible_count, has_audit, last_audit_at,
  // is_active, has_competent_professional_signoff
}

export async function getBlocks(hash: string, limit = 20) {
  const res = await fetch(`${API_BASE}/blocks/${hash}?limit=${limit}`);
  if (!res.ok) throw new Error("Blocks failed");
  return res.json();
  // { blocks: [], total, returned }
}

export async function postCompetentProfSignoff(
  client_hash: string,
  jurisdiction: string,
  signoff_text: string
) {
  const res = await fetch(`${API_BASE}/competent_professional_signoff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_hash, jurisdiction, signoff_text })
  });
  if (!res.ok) throw new Error("Signoff failed");
  return res.json();
}

export function getExportPdfUrl(hash: string) {
  return `${API_BASE}/export/pdf/${hash}`;
}

export async function getClients() {
  const res = await fetch(`${API_BASE}/clients`, {
    headers: { "x-api-key": ADMIN_API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch clients");
  return res.json();
}

export async function postAdminAudit(client_hash: string) {
  const res = await fetch(`${API_BASE}/admin/audit/${client_hash}`, {
    method: "POST",
    headers: { "x-api-key": ADMIN_API_KEY },
  });
  if (!res.ok) {
    const body = await res.text();
    console.log("[postAdminAudit] failed:", res.status, body);
    throw new Error("Audit failed");
  }
  return res.json();
}

export async function postAdminActivate(client_hash: string) {
  const res = await fetch(`${API_BASE}/admin/activate/${client_hash}`, {
    method: "POST",
    headers: { "x-api-key": ADMIN_API_KEY },
  });
  if (!res.ok) {
    const body = await res.text();
    console.log("[postAdminActivate] failed:", res.status, body);
    throw new Error("Activate failed");
  }
  return res.json();
}

