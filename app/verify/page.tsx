"use client";

import { useState } from "react";

const BACKEND_URL = "https://discerning-emotion-production-57fd.up.railway.app";

interface VerifyResult {
  valid: boolean;
  blocks: number;
  message: string;
  is_active?: boolean;
  broken_at_index?: number;
}

export default function VerifyPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const hash = input.trim();
    if (!hash) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/verify/${encodeURIComponent(hash)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("No forensic chain found for this hash. Verify the identifier and try again.");
        } else {
          setError(`Verification failed (${res.status}). Please try again.`);
        }
        return;
      }
      const data: VerifyResult = await res.json();
      setResult(data);
    } catch {
      setError("Unable to reach verification endpoint. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void handleVerify();
  };

  return (
    <div className="min-h-screen bg-[#060d18] text-white flex flex-col" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,49,83,0.35) 0%, transparent 60%)` }} />
      </div>

      <nav className="relative z-10 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] tracking-[0.4em] uppercase text-[#C9A84C]">Sovereign Vault</div>
          <div className="text-[10px] tracking-[0.2em] text-slate-500 uppercase mt-0.5">Forensic Verification Portal</div>
        </div>
        <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Back to Platform</a>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1e3a5f] bg-[#0d1520] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-slate-400 tracking-wider uppercase">Public Verification</span>
            </div>
            <h1 className="text-4xl text-white mb-4" style={{ fontWeight: 400, letterSpacing: "-0.02em" }}>Forensic Chain Verification</h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
              Enter a Sovereign Vault client identifier or Base58 trace hash to verify the cryptographic integrity of the forensic evidence chain. Available to any authorised auditor or regulator.
            </p>
          </div>

          <div className="bg-[#0d1520] border border-[#1e3a5f]/60 rounded-2xl p-6 mb-6">
            <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-3">Client Hash / Vault Identifier</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. admit-apart-call-camp-assume-benefit-blanket-boss..."
                className="flex-1 bg-[#060d18] border border-[#1e3a5f] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#C9A84C]/60 transition-colors font-mono"
              />
              <button type="button" onClick={handleVerify} disabled={loading || !input.trim()}
                className="px-6 py-3 bg-[#C9A84C] text-black text-sm font-semibold rounded-xl hover:bg-[#d4b560] disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-wide flex-shrink-0">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Verifying
                  </span>
                ) : "Verify"}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-3">Enter the hyphenated 12-word paper key identifier or the SHA-256 block hash from a forensic report.</p>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-950/20 rounded-xl p-5 text-sm text-red-400">{error}</div>
          )}

          {result && (
            <div className={`border rounded-2xl p-6 space-y-5 ${result.valid ? "border-emerald-500/30 bg-emerald-950/10" : "border-red-500/30 bg-red-950/10"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${result.valid ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-red-500/15 border border-red-500/30"}`}>
                  {result.valid ? (
                    <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className={`text-lg font-medium ${result.valid ? "text-emerald-400" : "text-red-400"}`}>
                    {result.valid ? "Chain Integrity Verified" : "Chain Integrity Compromised"}
                  </div>
                  <div className="text-sm text-slate-400 mt-0.5">{result.message}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-5">
                {[
                  { label: "Blocks Verified", value: result.blocks.toLocaleString() },
                  { label: "Chain Status", value: result.valid ? "INTACT" : "BROKEN" },
                  { label: "Vault Status", value: result.is_active ? "ACTIVE" : "LOCKED" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                    <div className={`text-sm font-mono font-medium ${stat.value === "INTACT" || stat.value === "ACTIVE" ? "text-emerald-400" : stat.value === "BROKEN" ? "text-red-400" : "text-white"}`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {!result.valid && result.broken_at_index !== undefined && (
                <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-4 text-xs text-red-300">
                  Chain integrity failure at block index <span className="font-mono font-semibold">{result.broken_at_index}</span>. This indicates the forensic record may have been tampered with after creation.
                </div>
              )}

              <div className="text-[10px] text-slate-600 border-t border-white/5 pt-4 leading-relaxed">
                SHA-256 cryptographic verification performed against the immutable append-only ledger. Each block hash is derived from its index, timestamp, predecessor hash, and payload. This verification is publicly available to any authorised auditor or regulatory body.
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center">
        <div className="text-[10px] text-slate-600">
          Sovereign Vault Forensic Verification Portal · SHA-256 Chain Integrity · This tool does not constitute legal or tax advice.
        </div>
      </footer>
    </div>
  );
}