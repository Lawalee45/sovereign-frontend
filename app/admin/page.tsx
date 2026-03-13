"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getClients,
  getArmSummary,
  postAdminAudit,
  postAdminActivate,
} from "@/lib/api";

const ADMIN_PASSWORD = "SOVEREIGN-ADMIN-2026";

interface ClientRow {
  client_hash: string;
  is_active?: boolean;
  blocks_analysed?: number;
}

function truncateHash(hash: string) {
  if (!hash || hash.length <= 12) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "audit" | "activate";
    success: boolean;
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, "audit" | "activate" | null>>({});

  const handleUnlock = (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (password.trim() === ADMIN_PASSWORD) {
      setUnlocked(true);
      setPassword("");
    } else {
      setPasswordError("Incorrect password.");
    }
  };

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getClients()
      .then((data) => {
        if (cancelled) return;
        const raw = Array.isArray(data) ? data : (data as any)?.clients ?? [];
        const list = raw.map((c: ClientRow) => ({
          client_hash: String(c.client_hash ?? ""),
          is_active: c.is_active,
          blocks_analysed: c.blocks_analysed,
        }));
        setClients(list);
        return Promise.all(
          list.map((c: ClientRow) =>
            getArmSummary(c.client_hash).catch(() => null)
          )
        );
      })
      .then((summaries) => {
        if (cancelled || !summaries) return;
        setClients((prev) =>
          prev.map((c, i) => ({
            ...c,
            blocks_analysed:
              (summaries[i] as any)?.blocks_analysed ?? c.blocks_analysed ?? null,
          }))
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load clients.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked]);

  const runAudit = async (client_hash: string) => {
    setActionLoading((s) => ({ ...s, [client_hash]: "audit" }));
    setError(null);
    setActionFeedback(null);
    try {
      await postAdminAudit(client_hash);
      const data = await getClients();
      const raw = Array.isArray(data) ? data : (data as any)?.clients ?? [];
      const next = raw.map((c: ClientRow) => ({
        client_hash: String(c.client_hash ?? ""),
        is_active: c.is_active,
        blocks_analysed: c.blocks_analysed,
      }));
      setClients(next);
      setActionFeedback({ type: "audit", success: true, message: "Audit completed successfully." });
    } catch (err: any) {
      const msg = err?.message ?? "Audit failed.";
      setError(msg);
      setActionFeedback({ type: "audit", success: false, message: msg });
    } finally {
      setActionLoading((s) => ({ ...s, [client_hash]: null }));
    }
  };

  const runActivate = async (client_hash: string) => {
    setActionLoading((s) => ({ ...s, [client_hash]: "activate" }));
    setError(null);
    setActionFeedback(null);
    try {
      await postAdminActivate(client_hash);
      const data = await getClients();
      const raw = Array.isArray(data) ? data : (data as any)?.clients ?? [];
      const next = raw.map((c: ClientRow) => ({
        client_hash: String(c.client_hash ?? ""),
        is_active: c.is_active,
        blocks_analysed: c.blocks_analysed,
      }));
      setClients(next);
      setActionFeedback({ type: "activate", success: true, message: "Activation completed successfully." });
    } catch (err: any) {
      const msg = err?.message ?? "Activate failed.";
      setError(msg);
      setActionFeedback({ type: "activate", success: false, message: msg });
    } finally {
      setActionLoading((s) => ({ ...s, [client_hash]: null }));
    }
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
        <div className="max-w-sm w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-400">
            Admin
          </p>
          <h1 className="mt-2 text-xl font-semibold text-white">
            Enter password
          </h1>
          <form onSubmit={handleUnlock} className="mt-4 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#003153] focus:border-[#003153]"
              autoFocus
            />
            {passwordError && (
              <p className="text-xs text-red-400">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 text-white"
            >
              Unlock
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-slate-400">
              SOVEREIGN VAULT
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Admin — Clients</h1>
          </div>
          <button
            type="button"
            onClick={() => setUnlocked(false)}
            className="text-xs px-3 py-1.5 rounded-md border border-white/20 text-slate-300 hover:bg-white/10"
          >
            Lock
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {actionFeedback && (
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-sm ${
              actionFeedback.success
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/40 bg-red-500/10 text-red-400"
            }`}
          >
            {actionFeedback.message}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton h-28 w-full rounded-xl"
              />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-slate-400 text-sm">
            No clients found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clients.map((client) => {
              const hash = client.client_hash;
              const auditLoading = actionLoading[hash] === "audit";
              const activateLoading = actionLoading[hash] === "activate";
              return (
                <div
                  key={hash}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4"
                >
                  <div className="font-mono-hash text-xs text-slate-300 break-all mb-2" title={hash}>
                    {truncateHash(hash)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
                    <span>
                      Status:{" "}
                      <span
                        className={
                          client.is_active
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {client.is_active ? "Active" : "Inactive"}
                      </span>
                    </span>
                    <span>
                      Blocks:{" "}
                      {client.blocks_analysed != null
                        ? client.blocks_analysed
                        : "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={auditLoading || activateLoading}
                      onClick={() => runAudit(hash)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {auditLoading ? "Running…" : "Run audit"}
                    </button>
                    <button
                      type="button"
                      disabled={auditLoading || activateLoading}
                      onClick={() => runActivate(hash)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activateLoading ? "Activating…" : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
