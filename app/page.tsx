"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, clearAuth, saveAuth } from "@/lib/auth";
import { getArmSummary, getBlocks, getExportPdfUrl } from "@/lib/api";
import { deriveVaultState, VaultState } from "@/lib/vaultStates";
import { getJurisdictionConfig } from "@/lib/jurisdictions";
import { CompetentProfModal } from "./components/CompetentProfModal";
import { VaultDrawer } from "./components/VaultDrawer";

const BACKEND_URL = "https://discerning-emotion-production-57fd.up.railway.app";

const JURISDICTION_OPTIONS = [
  { value: "uk",  label: "🇬🇧 United Kingdom", regime: "HMRC R&D Tax Relief" },
  { value: "usa", label: "🇺🇸 United States",  regime: "IRS Section 41" },
  { value: "uae", label: "🇦🇪 UAE",             regime: "UAE Corporate Tax" },
  { value: "ksa", label: "🇸🇦 Saudi Arabia",    regime: "ZATCA" },
];

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
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
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
      const value = fromRef.current + (targetRef.current - fromRef.current) * progress;
      setDisplay(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return display;
}

function BlankSlate({ onCreateVault }: { onCreateVault: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full border border-[#1e3a5f] bg-[#0d1520] flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-xl text-white font-medium tracking-wide mb-2">No Forensic Vault Yet</h2>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-8">
        Create your first vault to begin capturing R&D evidence on the blockchain and building your HMRC-ready claim.
      </p>
      <button type="button" onClick={onCreateVault} className="px-6 py-3 bg-[#C9A84C] text-black text-sm font-semibold rounded-xl hover:bg-[#d4b560] transition-colors tracking-wide shadow-[0_0_30px_rgba(201,168,76,0.2)]">
        Create Your First Forensic Vault
      </button>
    </div>
  );
}

export default function DashboardPage({ params }: { params: { jurisdiction: string } }) {
  const router = useRouter();
  const { jurisdiction: urlJurisdiction } = params;

  const [clientHash, setClientHash] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [jurisdiction, setJurisdiction] = useState<string>(urlJurisdiction);
  const [jurisdictionSaving, setJurisdictionSaving] = useState(false);
  const [summary, setSummary] = useState<ArmSummary | null>(null);
  const [blocks, setBlocks] = useState<BlockEvent[]>([]);
  const [vaultState, setVaultState] = useState<VaultState>("LOCKED");
  const [loading, setLoading] = useState(false);
  const [showCPModal, setShowCPModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lockedPolling, setLockedPolling] = useState(false);
  const lockedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = getJurisdictionConfig(jurisdiction);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.client_hash) { router.replace("/login"); return; }
    setClientHash(auth.client_hash);
    if (auth.jurisdiction) setJurisdiction(auth.jurisdiction);
    setAuthChecked(true);
  }, [router]);

  const loadData = async (hash: string) => {
    setLoading(true);
    try {
      const [arm, blk] = await Promise.all([getArmSummary(hash), getBlocks(hash, 20)]);
      const armSummary = arm as ArmSummary;
      const blocksRes = blk as BlocksResponse;
      setSummary(armSummary);
      setBlocks(blocksRes.blocks ?? []);
      setVaultState(deriveVaultState(armSummary.is_active, armSummary.blocks_analysed, armSummary.has_audit, armSummary.has_competent_professional_signoff));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (clientHash) void loadData(clientHash); }, [clientHash]);
  useEffect(() => { return () => { if (lockedIntervalRef.current) clearInterval(lockedIntervalRef.current); }; }, []);

  const handleJurisdictionChange = async (newJurisdiction: string) => {
    if (!clientHash || newJurisdiction === jurisdiction) return;
    setJurisdictionSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/meta/${clientHash}/jurisdiction`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jurisdiction: newJurisdiction }),
      });
      if (!res.ok) throw new Error("Failed");
      setJurisdiction(newJurisdiction);
      saveAuth(clientHash, summary?.is_active ?? false, newJurisdiction);
      router.replace(`/${newJurisdiction}/dashboard`);
    } catch {} finally { setJurisdictionSaving(false); }
  };

  const heroTarget = summary?.total_eligible_gbp_from_audit ?? 0;
  const heroDisplay = useCountUp(heroTarget, 1200);
  const chainIntact = useMemo(() => !!summary && summary.blocks_analysed > 0, [summary]);

  const handleLogout = () => { clearAuth(); router.replace("/login"); };
  const handleLockedVaultClick = () => setDrawerOpen(true);

  const handleVerifyActivation = () => {
    if (!clientHash || lockedPolling) return;
    setLockedPolling(true);
    lockedIntervalRef.current = setInterval(async () => {
      try {
        const arm = (await getArmSummary(clientHash)) as ArmSummary;
        setSummary(arm);
        const state = deriveVaultState(arm.is_active, arm.blocks_analysed, arm.has_audit, arm.has_competent_professional_signoff);
        setVaultState(state);
        if (state !== "LOCKED" && lockedIntervalRef.current) {
          clearInterval(lockedIntervalRef.current);
          setLockedPolling(false);
          void loadData(clientHash);
        }
      } catch {}
    }, 5000);
  };

  const handleExport = async () => {
    if (!clientHash || exporting) return;
    if (vaultState === "EXPORT_READY") {
      setExporting(true);
      try {
        const url = getExportPdfUrl(clientHash);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sovereign-vault-${clientHash}-audit.pdf`;
        a.click();
      } finally { setExporting(false); }
      return;
    }
    setShowCPModal(true);
  };

  const lastAuditDisplay = summary?.last_audit_at ? new Date(summary.last_audit_at).toLocaleString() : "No audit yet";
  const showExportButton = vaultState === "REVIEWED" || vaultState === "EXPORT_READY";

  const vaultBanner = (() => {
    if (vaultState === "CAPTURING") return <div className="w-full bg-amber-500/10 border-b border-amber-400/40 text-xs text-amber-100 px-4 py-2 text-center">Vault Active — Evidence Capturing. AI audit pending.</div>;
    if (vaultState === "REVIEWED") return <div className="w-full bg-emerald-500/10 border-b border-emerald-400/60 text-xs text-emerald-100 px-4 py-2 text-center">Audit Complete — Competent Professional sign-off required before export.</div>;
    if (vaultState === "EXPORT_READY") return <div className="w-full bg-emerald-500/20 border-b border-emerald-400/80 text-xs text-emerald-100 px-4 py-2 text-center shadow-[0_0_30px_rgba(34,197,94,0.55)]">Audit Complete — Export ready for regulator submission.</div>;
    return null;
  })();

  if (!authChecked) return <div className="min-h-screen bg-[#060d18] flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" /></div>;

  const isEmptyVault = !loading && summary !== null && summary.blocks_analysed === 0 && !summary.is_active;

  const HIGH_VALUE_TYPES = ["FRICTION_SIGNAL", "GITHUB_COMMIT", "AUDIT_SUMMARY", "COMPETENT_PROFESSIONAL_SIGNOFF"];
  const filteredBlocks = blocks.filter((b) => HIGH_VALUE_TYPES.includes(b.event_type));

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#0a0f1a]/90 backdrop-blur-md border-b border-white/10">
        {vaultBanner}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] tracking-[0.3em] uppercase text-slate-300">SOVEREIGN VAULT</div>
              <div className="text-xs text-slate-400">{config.regime}</div>
            </div>
            <div className="relative">
              <select value={jurisdiction} disabled={jurisdictionSaving} onChange={(e) => handleJurisdictionChange(e.target.value)}
                className="appearance-none bg-white/5 border border-white/15 rounded-md text-xs text-slate-200 px-3 py-1.5 pr-7 cursor-pointer hover:bg-white/10 focus:outline-none focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {JURISDICTION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value} className="bg-[#0a0f1a] text-white">{opt.label}</option>)}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                {jurisdictionSaving ? (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                ) : (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-2 ${chainIntact ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/60" : "bg-red-500/15 text-red-200 border border-red-500/60"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {chainIntact ? "CHAIN INTACT" : "CHAIN BROKEN"}
            </div>
            <div className="text-xs text-slate-300 font-mono">{truncateHash(clientHash)}</div>
            <button type="button" onClick={handleLogout} className="text-[11px] px-2 py-1 border border-white/20 rounded-md text-slate-200 hover:bg-white/10">Logout</button>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-10 max-w-6xl mx-auto px-4 space-y-6">
        {isEmptyVault ? (
          <BlankSlate onCreateVault={() => router.push("/generate-key")} />
        ) : (
          <>
            <section className="mt-4">
              <p className="text-[11px] tracking-[0.3em] uppercase text-slate-400">{config.heroLabel}</p>
              <div className="mt-3">
                {loading ? <div className="h-16 w-80 bg-white/5 rounded animate-pulse" /> : (
                  <div className="font-mono text-5xl md:text-6xl tabular-nums">{formatCurrency(heroDisplay, config.currency)}</div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Blocks in Chain", value: summary?.blocks_analysed ?? 0, mono: true },
                { label: "Integrity Score", value: summary ? `${summary.integrity_score}/100` : "0/100", mono: true },
                { label: "Eligible Signals", value: summary?.eligible_count ?? 0, mono: true },
                { label: "Last Audit", value: lastAuditDisplay, mono: false },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] uppercase text-slate-400">{stat.label}</p>
                  <div className="mt-2">
                    {loading ? <div className="h-5 w-20 bg-white/5 rounded animate-pulse" /> : (
                      <p className={`text-xl ${stat.mono ? "font-mono tabular-nums" : "text-xs text-slate-200"}`}>{stat.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2" />
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 max-h-[500px] flex flex-col">
                <div className="mb-3">
                  <p className="text-[11px] tracking-[0.3em] uppercase text-[#4a90b8]">FORENSIC LEDGER</p>
                  <p className="text-xs text-slate-400 mt-1">Showing high-value signals only</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 w-full bg-white/5 rounded animate-pulse" />)}</div>
                  ) : filteredBlocks.length === 0 ? (
                    <p className="text-xs text-slate-400">No R&D signals captured yet. Connect Slack or GitHub to begin.</p>
                  ) : (
                    filteredBlocks.map((block) => {
                      let badge = "border-slate-500/60 bg-slate-500/10 text-slate-100";
                      if (block.event_type === "FRICTION_SIGNAL") badge = "border-amber-400/70 bg-amber-500/10 text-amber-100";
                      else if (block.event_type === "GITHUB_COMMIT") badge = "border-violet-400/70 bg-violet-500/10 text-violet-100";
                      else if (block.event_type === "AUDIT_SUMMARY") badge = "border-emerald-400/70 bg-emerald-500/10 text-emerald-100";
                      else if (block.event_type === "COMPETENT_PROFESSIONAL_SIGNOFF") badge = "border-[#C9A84C]/70 bg-[#C9A84C]/10 text-[#C9A84C]";

                      const auditGbp = block.event_type === "AUDIT_SUMMARY" && block.metadata?.total_eligible_gbp ? block.metadata.total_eligible_gbp : null;

                      return (
                        <div key={block.index} className="border-l-2 border-[#003153] bg-white/5 rounded-lg p-3 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-slate-300">#{block.index}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge}`}>{block.event_type}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{new Date(block.timestamp).toLocaleString()}</div>
                          <div className="mt-1 font-mono text-[10px] text-slate-400 break-all">{block.block_hash?.slice(0, 32)}</div>
                          {block.event_type === "FRICTION_SIGNAL" && block.metadata?.text && (
                            <div className="mt-1 text-[11px] italic text-amber-100">{block.metadata.text}</div>
                          )}
                          {auditGbp !== null && (
                            <div className="mt-1 text-[11px] text-emerald-300">{config.symbol}{auditGbp.toLocaleString()} eligible</div>
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
                  <button type="button" onClick={handleExport} disabled={exporting}
                    className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed ${vaultState === "EXPORT_READY" ? "bg-emerald-500 text-black shadow-[0_0_25px_rgba(34,197,94,0.6)]" : "border border-emerald-400 text-emerald-200 bg-transparent"}`}>
                    {exporting ? "Opening…" : "Export Forensic Report"}
                  </button>
                  {vaultState !== "EXPORT_READY" && (
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 -top-2 -translate-y-full">
                      <div className="max-w-xs bg-black/90 border border-white/15 text-slate-100 text-[11px] px-3 py-2 rounded-md shadow-lg">Competent Professional sign-off required before export.</div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {vaultState === "LOCKED" && !isEmptyVault && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-[#0a0f1a] border border-[#C9A84C] rounded-2xl p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-[0.25em] uppercase text-white">VAULT LOCKED</h2>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">Your forensic vault is registered. Complete payment to unlock live evidence capture, AI auditing, and PDF export.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
              {["Forensic blockchain evidence capture", "AI-powered HMRC eligibility audit", "Competent Professional sign-off flow", "Regulator-ready PDF export"].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-[11px] text-slate-300">
                  <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feat}
                </div>
              ))}
            </div>
            <button type="button" onClick={handleLockedVaultClick} className="w-full py-3 px-6 rounded-xl bg-[#C9A84C] text-black font-semibold text-sm tracking-wide hover:bg-[#d4b560] transition-colors shadow-[0_0_30px_rgba(201,168,76,0.3)]">
              Complete Payment to Activate
            </button>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">already paid?</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <button type="button" onClick={handleVerifyActivation} disabled={lockedPolling}
              className="w-full py-2 px-4 rounded-lg border border-white/20 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {lockedPolling ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  Checking activation…
                </span>
              ) : "Verify Activation"}
            </button>
          </div>
        </div>
      )}

      <VaultDrawer open={drawerOpen} clientHash={clientHash ?? ""} onClose={() => setDrawerOpen(false)} />

      <CompetentProfModal open={showCPModal} clientHash={clientHash ?? ""} jurisdiction={jurisdiction} onClose={() => setShowCPModal(false)}
        onSuccess={async () => { if (!clientHash) return; await loadData(clientHash); }} />
    </div>
  );
}