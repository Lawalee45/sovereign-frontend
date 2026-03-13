"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth } from "@/lib/auth";
import { getArmSummary, getBlocks, getExportPdfUrl } from "@/lib/api";
import { deriveVaultState, VaultState } from "@/lib/vaultStates";
import { getJurisdictionConfig } from "@/lib/jurisdictions";
import { CompetentProfModal } from "./components/CompetentProfModal";

interface ArmSummary {
  total_eligible_gbp_from_audit: number;
  blocks_analysed: number;
  integrity_score: number;
  eligible_count: number;
  ineligible_count: number;
  has_audit: boolean;
  last_audit_at: string | null;
  is_active: boolean;
  has_competent_professional_signoff: boolean;
}

interface BlockMetadata {
  text?: string;
  total_eligible_gbp?: number;
  eligible_amount?: number;
  message?: string;
  activated_at?: string;
}

interface BlockEvent {
  index: number;
  event_type: string;
  timestamp: string;
  block_hash: string;
  metadata?: BlockMetadata;
}

interface BlocksResponse {
  blocks: BlockEvent[];
  total: number;
  returned: number;
}

function truncateHash(hash: string | null) {
  if (!hash) return "";
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

function useCountUp(target: number, durationMs: number) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const targetRef = useRef(target);

  useEffect(() => {
    fromRef.current = display;
    targetRef.current = target;
    startRef.current = null;

    let frame: number;
    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const value =
        fromRef.current +
        (targetRef.current - fromRef.current) * progress;
      setDisplay(value);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return display;
}

export default function DashboardPage({
  params,
}: {
  params: { jurisdiction: string };
}) {
  const router = useRouter();
  const { jurisdiction } = params;
  const config = getJurisdictionConfig(jurisdiction);

  const [clientHash, setClientHash] = useState<string | null>(null);
  const [summary, setSummary] = useState<ArmSummary | null>(null);
  const [blocks, setBlocks] = useState<BlockEvent[]>([]);
  const [vaultState, setVaultState] = useState<VaultState>("LOCKED");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lockedPolling, setLockedPolling] = useState(false);
  const lockedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.client_hash) {
      router.replace("/login");
      return;
    }
    setClientHash(auth.client_hash);
  }, [router]);

  const loadData = async (hash: string) => {
    setLoading(true);
    try {
      const [arm, blk] = await Promise.all([
        getArmSummary(hash),
        getBlocks(hash, 20),
      ]);
      const armSummary = arm as ArmSummary;
      const blocksRes = blk as BlocksResponse;
      setSummary(armSummary);
      setBlocks(blocksRes.blocks || []);
      const state = deriveVaultState(
        armSummary.is_active,
        armSummary.blocks_analysed,
        armSummary.has_audit,
        armSummary.has_competent_professional_signoff
      );
      setVaultState(state);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientHash) return;
    void loadData(clientHash);
  }, [clientHash]);

  useEffect(() => {
    return () => {
      if (lockedIntervalRef.current) {
        clearInterval(lockedIntervalRef.current);
      }
    };
  }, []);

  const heroTarget = summary?.total_eligible_gbp_from_audit ?? 0;
  const heroDisplay = useCountUp(heroTarget, 1200);

  const chainIntact = useMemo(() => {
    if (!summary) return false;
    if (summary.blocks_analysed === 0) return false;
    return true;
  }, [summary]);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  const handleVerifyActivation = () => {
    if (!clientHash || lockedPolling) return;
    setLockedPolling(true);
    lockedIntervalRef.current = setInterval(async () => {
      try {
        const arm = (await getArmSummary(clientHash)) as ArmSummary;
        setSummary(arm);
        const state = deriveVaultState(
          arm.is_active,
          arm.blocks_analysed,
          arm.has_audit,
          arm.has_competent_professional_signoff
        );
        setVaultState(state);
        if (state !== "LOCKED" && lockedIntervalRef.current) {
          clearInterval(lockedIntervalRef.current);
          setLockedPolling(false);
          void loadData(clientHash);
        }
      } catch {
        // silent while polling
      }
    }, 5000);
  };

  const lastAuditDisplay = summary?.last_audit_at
    ? new Date(summary.last_audit_at).toLocaleString()
    : "No audit yet";

  const vaultBanner = (() => {
    if (vaultState === "CAPTURING") {
      return (
        <div className="w-full bg-amber-500/10 border-b border-amber-400/40 text-xs text-amber-100 px-4 py-2 text-center">
          Vault Active — Evidence Capturing. AI audit pending.
        </div>
      );
    }
    if (vaultState === "REVIEWED") {
      return (
        <div className="w-full bg-emerald-500/10 border-b border-emerald-400/60 text-xs text-emerald-100 px-4 py-2 text-center">
          Audit Complete — Competent Professional sign-off required before export.
        </div>
      );
    }
    if (vaultState === "EXPORT_READY") {
      return (
        <div className="w-full bg-emerald-500/20 border-b border-emerald-400/80 text-xs text-emerald-100 px-4 py-2 text-center shadow-[0_0_30px_rgba(34,197,94,0.55)]">
          Audit Complete — Export ready for regulator submission.
        </div>
      );
    }
    return null;
  })();

  const showExportButton =
    vaultState === "REVIEWED" || vaultState === "EXPORT_READY";

  const handleExport = async () => {
    if (!clientHash || exporting) return;
    if (vaultState === "EXPORT_READY") {
      setExporting(true);
      try {
        const url = getExportPdfUrl(clientHash);
        window.open(url, "_blank", "noopener,noreferrer");
      } finally {
        setExporting(false);
      }
      return;
    }

    // Not export-ready: prompt sign-off flow.
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-white/10">
        {vaultBanner}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-slate-300">
              SOVEREIGN VAULT
            </div>
            <div className="text-xs text-slate-400">
              {config.label} · {config.regime}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-2 ${
                chainIntact
                  ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/60"
                  : "bg-red-500/15 text-red-200 border border-red-500/60"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {chainIntact ? "CHAIN INTACT" : "CHAIN BROKEN"}
            </div>
            <div className="text-xs text-slate-300 font-mono-hash">
              {truncateHash(clientHash)}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] px-2 py-1 border border-white/20 rounded-md text-slate-200 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-10 max-w-6xl mx-auto px-4 space-y-6">
        <section className="mt-4">
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-400">
            {config.heroLabel}
          </p>
          <div className="mt-3">
            {loading ? (
              <div className="skeleton h-16 w-80" />
            ) : (
              <div className="font-mono-hash text-5xl md:text-6xl">
                {formatCurrency(heroDisplay, config.currency)}
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase text-slate-400">Blocks in Chain</p>
            <div className="mt-2">
              {loading ? (
                <div className="skeleton h-5 w-12" />
              ) : (
                <p className="font-mono-hash text-xl">{summary?.blocks_analysed ?? 0}</p>
              )}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase text-slate-400">Integrity Score</p>
            <div className="mt-2">
              {loading ? (
                <div className="skeleton h-5 w-16" />
              ) : (
                <p className="font-mono-hash text-xl">
                  {summary ? `${summary.integrity_score}/100` : "0/100"}
                </p>
              )}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase text-slate-400">Eligible Signals</p>
            <div className="mt-2">
              {loading ? (
                <div className="skeleton h-5 w-16" />
              ) : (
                <p className="font-mono-hash text-xl">{summary?.eligible_count ?? 0}</p>
              )}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase text-slate-400">Last Audit</p>
            <div className="mt-2">
              {loading ? (
                <div className="skeleton h-5 w-40" />
              ) : (
                <p className="text-xs text-slate-200">{lastAuditDisplay}</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" />
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 max-h-[500px] flex flex-col">
            <div className="mb-3">
              <p className="text-[11px] tracking-[0.3em] uppercase text-[#4a90b8]">
                FORENSIC LEDGER
              </p>
              <p className="text-xs text-slate-400 mt-1">Last {blocks.length} blocks</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 w-full" />
                  ))}
                </div>
              ) : blocks.length === 0 ? (
                <p className="text-xs text-slate-400">No chain events recorded.</p>
              ) : (
                blocks.map((block) => {
                  let badgeClasses = "border-slate-500/60 bg-slate-500/10 text-slate-100";
                  if (block.event_type === "FRICTION_SIGNAL") {
                    badgeClasses = "border-amber-400/70 bg-amber-500/10 text-amber-100";
                  } else if (block.event_type === "AUDIT_SUMMARY") {
                    badgeClasses = "border-emerald-400/70 bg-emerald-500/10 text-emerald-100";
                  } else if (block.event_type === "VAULT_ACTIVATED") {
                    badgeClasses = "border-sky-400/70 bg-sky-500/10 text-sky-100";
                  } else if (block.event_type === "CLIENT_ONBOARDED") {
                    badgeClasses = "border-slate-400/70 bg-slate-500/10 text-slate-100";
                  }

                  const auditGbp =
                    block.event_type === "AUDIT_SUMMARY" &&
                    block.metadata?.total_eligible_gbp
                      ? block.metadata.total_eligible_gbp
                      : null;

                  return (
                    <div
                      key={block.index}
                      className="border-l-2 border-[#003153] bg-white/5 rounded-lg p-3 mb-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono-hash text-xs text-slate-300">
                          #{block.index}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeClasses}`}>
                          {block.event_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(block.timestamp).toLocaleString()}
                      </div>
                      <div className="mt-1 font-mono-hash text-[10px] text-slate-400 break-all">
                        {block.block_hash?.slice(0, 32)}
                      </div>
                      {block.event_type === "FRICTION_SIGNAL" && block.metadata?.text && (
                        <div className="mt-1 text-[11px] italic text-amber-100">
                          {block.metadata.text}
                        </div>
                      )}
                      {auditGbp !== null && (
                        <div className="mt-1 text-[11px] text-emerald-300">
                          {config.symbol}{auditGbp.toLocaleString()} eligible
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {showExportButton && clientHash && (
          <section className="flex justify-end mt-2">
            <div className="relative group">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                  vaultState === "EXPORT_READY"
                    ? "bg-emerald-500 text-black shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                    : "border border-emerald-400 text-emerald-200 bg-transparent"
                }`}
              >
                {exporting ? "Opening…" : "Export Forensic Report"}
              </button>

              {vaultState !== "EXPORT_READY" && (
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 -top-2 -translate-y-full">
                  <div className="max-w-xs bg-black/90 border border-white/15 text-slate-100 text-[11px] px-3 py-2 rounded-md shadow-lg">
                    Competent Professional sign-off is required before export.
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {vaultState === "LOCKED" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-[#0a0f1a] border border-[#C9A84C] rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold tracking-[0.25em] uppercase text-white">
              VAULT LOCKED
            </h2>
            <p className="text-xs text-slate-200">
              Your vault is pending activation. Complete payment to unlock live
              forensic evidence and PDF exports.
            </p>
            <button
              type="button"
              onClick={handleVerifyActivation}
              disabled={lockedPolling}
              className="mt-2 px-4 py-2 rounded-md bg-[#003153] text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {lockedPolling ? "Verifying..." : "Verify Activation"}
            </button>
            <p className="text-[11px] text-slate-500">
              Polls ARM summary every 5 seconds until activation.
            </p>
          </div>
        </div>
      )}

      <CompetentProfModal
        open={showModal}
        clientHash={clientHash ?? ""}
        jurisdiction={jurisdiction}
        onClose={() => setShowModal(false)}
        onSuccess={async () => {
          if (!clientHash) return;
          await loadData(clientHash);
        }}
      />
    </div>
  );
}