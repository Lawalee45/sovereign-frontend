"use client";
import { useEffect, useRef, useState } from "react";

const BACKEND_URL = "https://discerning-emotion-production-57fd.up.railway.app";
const RETAINER_GBP = 2500;
const SUCCESS_SHARE_PCT = 0.10;
const CLIENT_SHARE_PCT = 0.90;
const MANUAL_LABOUR_COST = 8500;

interface AccrualData {
  accrual_value: number;
  currency: string;
  locale: string;
  eligible_signals: number;
  rate_per_signal: number;
  jurisdiction: string;
}

export interface VaultDrawerProps {
  open: boolean;
  clientHash: string;
  vaultName?: string;
  onClose: () => void;
}

function fmt(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function VaultDrawer({ open, clientHash, vaultName, onClose }: VaultDrawerProps) {
  const [accrual, setAccrual] = useState<AccrualData | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !clientHash) return;
    setLoading(true);
    setAccrual(null);
    setPayError(null);
    fetch(`${BACKEND_URL}/api/accrual/${clientHash}`)
      .then((r) => { if (!r.ok) throw new Error("failed"); return r.json(); })
      .then((data: AccrualData) => setAccrual(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, clientHash]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleUnlock = async () => {
    if (!clientHash || paying) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/billing/checkout/${clientHash}`, { method: "POST" });
      if (!res.ok) throw new Error("Checkout failed");
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch {
      setPayError("Payment unavailable. Please try again or contact support.");
      setPaying(false);
    }
  };

  const accrualValue = accrual?.accrual_value ?? 0;
  const successFee = Math.round(accrualValue * SUCCESS_SHARE_PCT);
  const clientTakeHome = Math.round(accrualValue * CLIENT_SHARE_PCT);
  const locale = accrual?.locale ?? "en-GB";
  const currency = accrual?.currency ?? "GBP";
  const formattedAccrual = accrual ? fmt(accrualValue, locale, currency) : null;
  const formattedRate = accrual ? fmt(accrual.rate_per_signal, locale, currency) : null;
  const formattedClientShare = fmt(clientTakeHome, locale, currency);
  const formattedSuccessFee = fmt(successFee, locale, currency);
  const formattedRetainer = fmt(RETAINER_GBP, "en-GB", "GBP");
  const formattedLabour = fmt(MANUAL_LABOUR_COST, "en-GB", "GBP");

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${open ? "opacity-60" : "opacity-0 pointer-events-none"}`}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Vault activation"
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-[#0a0f1a] border-l border-[#1e3a5f] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C]">Vault Access</div>
            <div className="text-sm text-white mt-0.5 font-medium truncate max-w-[260px]">
              {vaultName ?? `${clientHash?.slice(0, 28)}…`}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close drawer" className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[11px] text-[#C9A84C] tracking-wider uppercase">Vault Locked</span>
          </div>
          <div className="bg-[#0d1520] border border-[#1e3a5f] rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Conservative Accrual Value</div>
            {loading ? (
              <div className="h-9 w-36 bg-white/5 rounded animate-pulse mt-1" />
            ) : formattedAccrual ? (
              <>
                <div className="text-3xl text-white font-mono mt-1 tabular-nums">{formattedAccrual}</div>
                <div className="text-[11px] text-slate-500 mt-2">{accrual?.eligible_signals ?? 0} signals x {formattedRate} safe-bet rate</div>
                <div className="text-[10px] text-slate-600 mt-1">Conservative estimate. Final claim will be higher after AI audit.</div>
              </>
            ) : (
              <div className="text-sm text-slate-500 mt-1">Capture friction signals to see your accrual value.</div>
            )}
          </div>
          {accrualValue > 0 && (
            <div className="bg-[#0a1a0a] border border-emerald-900/60 rounded-xl p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-emerald-500">Partner Economics</div>
              <div>
                <div className="text-[11px] text-slate-400 mb-0.5">Your estimated take-home (90%)</div>
                <div className="text-2xl text-emerald-400 font-mono tabular-nums">{formattedClientShare}</div>
              </div>
              <div className="space-y-2 border-t border-white/5 pt-4">
                {[
                  { label: "Gross R&D Recovery", value: formattedAccrual, valueClass: "text-white", note: "Conservative estimate", highlight: false },
                  { label: "Monthly Technical Retainer", value: "- " + formattedRetainer, valueClass: "text-slate-400", note: "Forensic evidence infrastructure", highlight: false },
                  { label: "Success Fee (10%)", value: "- " + formattedSuccessFee, valueClass: "text-slate-400", note: "Only on recovered value", highlight: false },
                  { label: "Your Net Recovery", value: formattedClientShare, valueClass: "text-emerald-400 font-semibold", note: "", highlight: true },
                ].map((row) => (
                  <div key={row.label} className={`flex justify-between items-start gap-4 text-xs ${row.highlight ? "pt-2 border-t border-white/10" : ""}`}>
                    <div>
                      <div className={row.highlight ? "text-slate-200" : "text-slate-400"}>{row.label}</div>
                      {row.note && <div className="text-[10px] text-slate-600 mt-0.5">{row.note}</div>}
                    </div>
                    <div className={`font-mono tabular-nums flex-shrink-0 ${row.valueClass}`}>{row.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-4 py-3">
                <div className="text-[10px] uppercase tracking-widest text-emerald-600 mb-1">vs. Manual Preparation</div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">Traditional accountant fees</div>
                  <div className="text-xs text-red-400 font-mono line-through">{formattedLabour}</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-slate-300 font-medium">You save</div>
                  <div className="text-xs text-emerald-400 font-mono font-semibold">{fmt(MANUAL_LABOUR_COST - RETAINER_GBP, "en-GB", "GBP")} / year</div>
                </div>
              </div>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Unlocks With Activation</div>
            <div className="space-y-2.5">
              {["Live forensic blockchain evidence capture", "AI-powered HMRC / IRS eligibility audit", "Competent Professional sign-off workflow", "Regulator-ready PDF forensic export", "Slack and GitHub evidence ingestion"].map((feat) => (
                <div key={feat} className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="w-4 h-4 rounded-full border border-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/40" />
                  </div>
                  {feat}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0d1520] border border-[#1e3a5f]/60 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-medium">Pricing: </span>
            2500/mo retainer + 10% success fee on recovered value only. Cancel anytime before your filing date.
          </div>
        </div>
        <div className="px-6 py-5 border-t border-white/[0.08] space-y-3">
          {payError && <p className="text-[11px] text-red-400 text-center">{payError}</p>}
          <button type="button" onClick={handleUnlock} disabled={paying} className="w-full py-3.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-xl hover:bg-[#d4b560] disabled:opacity-60 disabled:cursor-not-allowed transition-colors tracking-wide shadow-[0_0_30px_rgba(201,168,76,0.25)]">
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Redirecting to payment...
              </span>
            ) : "Complete Payment to Activate"}
          </button>
          <p className="text-[10px] text-slate-600 text-center">2500/mo + 10% success fee. Secured by Stripe.</p>
        </div>
      </div>
    </>
  );
}
