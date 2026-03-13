"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = "https://discerning-emotion-production-57fd.up.railway.app";

interface EligibilityResult {
  tier: string;
  total_cr: number;
  recovery_value: number;
  success_fee: number;
  symbol: string;
  currency: string;
  regime: string;
  message: string;
  proceed: boolean;
}

const JURISDICTIONS = [
  { value: "UK",  label: "🇬🇧 United Kingdom", regime: "HMRC R&D Tax Relief",  placeholder: "e.g. 250000" },
  { value: "USA", label: "🇺🇸 United States",   regime: "IRS Section 41",       placeholder: "e.g. 500000" },
  { value: "UAE", label: "🇦🇪 UAE",              regime: "UAE Corporate Tax",    placeholder: "e.g. 1000000" },
  { value: "KSA", label: "🇸🇦 Saudi Arabia",     regime: "ZATCA",               placeholder: "e.g. 2000000" },
];

const SECTORS = ["Software", "Engineering", "Life Sciences", "Construction", "Energy", "Other"];
const GRANT_TYPES = [
  { value: "RD_TAX_CREDIT",    label: "R&D Tax Credit" },
  { value: "INNOVATION_GRANT", label: "Innovation Grant" },
  { value: "CAPEX",            label: "Capital Expenditure" },
];
const FRICTION_TYPES = ["Algorithmic", "Material Science", "Structural Engineering", "Process Failure", "Other"];
const COMPANY_SIZES = ["SME", "Large"];

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
}) {
  const normalised = (options as (string | { value: string; label: string })[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#0d1520] border border-[#1e3a5f] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#C9A84C]/60 transition-colors cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalised.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0d1520]">{o.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  const [jurisdiction, setJurisdiction] = useState("UK");
  const [sector, setSector] = useState("Software");
  const [grantType, setGrantType] = useState("RD_TAX_CREDIT");
  const [spend, setSpend] = useState("");
  const [frictionType, setFrictionType] = useState("Algorithmic");
  const [companySize, setCompanySize] = useState("SME");
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!spend || isNaN(Number(spend)) || Number(spend) <= 0) {
      setCalcError("Please enter a valid technical spend amount.");
      return;
    }
    setCalculating(true);
    setCalcError(null);
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/eligibility/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurisdiction,
          sector,
          grant_type: grantType,
          technical_spend: Number(spend),
          friction_type: frictionType,
          company_size: companySize,
        }),
      });
      if (!res.ok) throw new Error("Calculation failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setCalcError("Unable to calculate at this time. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const tierColour = (tier: string) => {
    if (tier === "ENTERPRISE") return "text-[#C9A84C]";
    if (tier === "PRIORITY") return "text-emerald-400";
    if (tier === "STANDARD") return "text-sky-400";
    return "text-red-400";
  };

  const tierBg = (tier: string) => {
    if (tier === "ENTERPRISE") return "border-[#C9A84C]/40 bg-[#C9A84C]/5";
    if (tier === "PRIORITY") return "border-emerald-400/40 bg-emerald-500/5";
    if (tier === "STANDARD") return "border-sky-400/40 bg-sky-500/5";
    return "border-red-400/40 bg-red-500/5";
  };

  const selectedJurisdiction = JURISDICTIONS.find((j) => j.value === jurisdiction)!;

  return (
    <div className="min-h-screen bg-[#060d18] text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,49,83,0.4) 0%, transparent 60%),
                            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(201,168,76,0.06) 0%, transparent 50%)`,
        }}/>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(255,255,255,0.3) 80px, rgba(255,255,255,0.3) 81px),
                            repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,255,255,0.3) 80px, rgba(255,255,255,0.3) 81px)`,
        }}/>
      </div>

      <nav className="relative z-20 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] tracking-[0.4em] uppercase text-[#C9A84C]">Sovereign Vault</div>
            <div className="text-[10px] tracking-[0.2em] text-slate-500 uppercase mt-0.5">R&D Evidence Platform</div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-xs text-slate-400 hover:text-slate-200 transition-colors tracking-wide">How it works</a>
            <a href="#calculator" className="text-xs text-slate-400 hover:text-slate-200 transition-colors tracking-wide">Calculator</a>
            <button
              onClick={() => router.push("/login")}
              className="text-xs px-4 py-2 border border-[#C9A84C]/50 text-[#C9A84C] rounded-lg hover:bg-[#C9A84C]/10 transition-colors tracking-wide"
            >
              Client Login
            </button>
          </div>
        </div>
      </nav>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1e3a5f] bg-[#0d1520] mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[11px] text-slate-400 tracking-wider uppercase">HMRC · IRS · ZATCA · UAE Compliant</span>
          </div>
          <h1 className="text-5xl md:text-6xl leading-[1.1] text-white mb-6" style={{ fontWeight: 400, letterSpacing: "-0.02em" }}>
            Your R&D evidence,<br/>
            <span className="text-[#C9A84C]">forensically secured.</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl">
            Sovereign Vault captures your technical activity in a cryptographically
            verified blockchain ledger — producing regulator-ready evidence that
            withstands HMRC, IRS, and ZATCA scrutiny.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#calculator" className="px-6 py-3 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b560] transition-colors tracking-wide shadow-[0_0_40px_rgba(201,168,76,0.25)]">
              See If You Qualify →
            </a>
            <a href="#how-it-works" className="px-6 py-3 border border-white/15 text-slate-300 text-sm rounded-lg hover:bg-white/5 transition-colors tracking-wide">
              How It Works
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-16">
          {JURISDICTIONS.map((j) => (
            <div key={j.value} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#1e3a5f] bg-[#0d1520]/80 text-xs text-slate-400">
              <span>{j.label}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{j.regime}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 border-y border-white/5 bg-[#0a1220]/60">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { stat: "SHA-256", label: "Block-level cryptographic integrity" },
            { stat: "AI Audit", label: "Claude Haiku HMRC eligibility scoring" },
            { stat: "Non-custodial", label: "No PII stored. Ever." },
            { stat: "PDF Export", label: "Regulator-ready submission bundle" },
          ].map((item) => (
            <div key={item.stat} className="text-center">
              <div className="text-lg text-[#C9A84C] tracking-widest uppercase" style={{ fontFamily: "monospace" }}>{item.stat}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C] mb-3">The Process</div>
          <h2 className="text-3xl text-white" style={{ fontWeight: 400 }}>From activity to submission,<br/>fully documented.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1e3a5f]/20 rounded-2xl overflow-hidden border border-[#1e3a5f]/40">
          {[
            { step: "01", title: "Evidence Capture", body: "Connect Slack and GitHub. Every qualifying technical signal — commits, discussions, friction points — is vaulted as an immutable blockchain block with a SHA-256 hash." },
            { step: "02", title: "AI Audit", body: "Claude Haiku reviews every captured signal against HMRC's four-part test, IRS Section 41 criteria, and ZATCA guidelines — assigning eligibility scores and GBP/USD/AED values." },
            { step: "03", title: "Regulator Bundle", body: "A Competent Professional signs off the audit. You export a forensic PDF — cryptographically anchored, timestamped, and ready for your accountant or direct regulator submission." },
          ].map((item) => (
            <div key={item.step} className="bg-[#0a1220] p-8">
              <div className="text-[10px] text-slate-600 font-mono tracking-widest mb-4">{item.step}</div>
              <h3 className="text-base text-white mb-3 tracking-wide" style={{ fontWeight: 500 }}>{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="calculator" className="relative z-10 bg-[#0a1220]/60 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-12">
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C] mb-3">Eligibility Calculator</div>
            <h2 className="text-3xl text-white" style={{ fontWeight: 400 }}>Find out what your R&D<br/>activity is worth.</h2>
            <p className="mt-3 text-sm text-slate-500 max-w-lg">
              Enter your technical spend and we'll calculate your estimated recovery value across all four regimes in real time.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0d1520] border border-[#1e3a5f]/60 rounded-2xl p-8 space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2">Jurisdiction</label>
                <div className="grid grid-cols-2 gap-2">
                  {JURISDICTIONS.map((j) => (
                    <button
                      key={j.value}
                      type="button"
                      onClick={() => setJurisdiction(j.value)}
                      className={`py-2.5 px-3 rounded-lg border text-xs text-left transition-colors ${
                        jurisdiction === j.value
                          ? "border-[#C9A84C]/60 bg-[#C9A84C]/8 text-[#C9A84C]"
                          : "border-[#1e3a5f] text-slate-400 hover:border-[#1e3a5f]/80"
                      }`}
                    >
                      <div>{j.label}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{j.regime}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                  Annual Technical Spend ({selectedJurisdiction.regime})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    {jurisdiction === "UK" ? "£" : jurisdiction === "USA" ? "$" : jurisdiction === "UAE" ? "AED" : "SAR"}
                  </span>
                  <input
                    type="number"
                    value={spend}
                    onChange={(e) => setSpend(e.target.value)}
                    placeholder={selectedJurisdiction.placeholder}
                    className="w-full bg-[#060d18] border border-[#1e3a5f] rounded-lg pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#C9A84C]/60 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2">Sector</label>
                  <Select value={sector} onChange={setSector} options={SECTORS} />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2">Company Size</label>
                  <Select value={companySize} onChange={setCompanySize} options={COMPANY_SIZES} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2">Claim Type</label>
                  <Select value={grantType} onChange={setGrantType} options={GRANT_TYPES} />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2">Activity Type</label>
                  <Select value={frictionType} onChange={setFrictionType} options={FRICTION_TYPES} />
                </div>
              </div>
              {calcError && <p className="text-[11px] text-red-400">{calcError}</p>}
              <button
                type="button"
                onClick={handleCalculate}
                disabled={calculating}
                className="w-full py-3.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b560] disabled:opacity-60 disabled:cursor-not-allowed transition-colors tracking-wide shadow-[0_0_30px_rgba(201,168,76,0.2)]"
              >
                {calculating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Calculating…
                  </span>
                ) : "Calculate My Recovery Value"}
              </button>
            </div>

            <div className="flex flex-col">
              {!result && !calculating && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#1e3a5f] rounded-2xl">
                  <div className="w-14 h-14 rounded-full border border-[#1e3a5f] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">Enter your details and click<br/>Calculate to see your recovery estimate.</p>
                </div>
              )}
              {result && (
                <div className={`flex-1 border rounded-2xl p-8 ${tierBg(result.tier)}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`text-[11px] uppercase tracking-widest font-semibold ${tierColour(result.tier)}`}>
                      {result.tier} CASE
                    </div>
                    <div className={`text-[11px] px-3 py-1 rounded-full border ${
                      result.proceed ? "border-emerald-400/40 text-emerald-400" : "border-red-400/40 text-red-400"
                    }`}>
                      {result.proceed ? "Viable" : "Below Threshold"}
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">Estimated Recovery Value</div>
                    <div className="text-4xl text-white" style={{ fontFamily: "monospace" }}>
                      {result.symbol}{Math.round(result.recovery_value).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{result.currency} · {result.regime}</div>
                  </div>
                  <div className="space-y-3 mb-6 border-t border-white/5 pt-5">
                    {[
                      { label: "Retainer", value: `${result.symbol}2,000` },
                      { label: "Recovery Value", value: `${result.symbol}${Math.round(result.recovery_value).toLocaleString()}` },
                      { label: "Success Fee", value: `${result.symbol}${Math.round(result.success_fee).toLocaleString()}` },
                      { label: "Total Case Value", value: `${result.symbol}${Math.round(result.total_cr).toLocaleString()}`, highlight: true },
                    ].map((row) => (
                      <div key={row.label} className={`flex justify-between text-sm ${row.highlight ? "text-white font-semibold" : "text-slate-400"}`}>
                        <span>{row.label}</span>
                        <span className={row.highlight ? tierColour(result.tier) : ""}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">{result.message}</p>
                  {result.proceed && (
                    <button
                      type="button"
                      onClick={() => router.push("/generate-key")}
                      className="w-full py-3 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b560] transition-colors tracking-wide"
                    >
                      Get Your Paper Key →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C] mb-3">Compliance Architecture</div>
          <h2 className="text-3xl text-white" style={{ fontWeight: 400 }}>Built for scrutiny.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: "Immutable Ledger", body: "Every event is cryptographically chained. SHA-256 hashes link each block to the previous — making retroactive tampering mathematically detectable." },
            { title: "Non-Custodial by Design", body: "Sovereign Vault never stores names, emails, or company identifiers. Your identity is your Paper Key — 12 words, held only by you." },
            { title: "AI-Assisted Audit Trail", body: "Claude Haiku scores every signal against jurisdiction-specific eligibility criteria, generating a structured rationale for each qualifying activity." },
            { title: "Competent Professional Sign-Off", body: "The HMRC-mandated CP sign-off is built into the workflow. No export is possible until a qualified professional has reviewed and approved the audit." },
          ].map((item) => (
            <div key={item.title} className="border border-[#1e3a5f]/50 rounded-xl p-6 bg-[#0a1220]/40">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-2 flex-shrink-0"/>
                <div>
                  <h3 className="text-sm text-white mb-2 tracking-wide" style={{ fontWeight: 500 }}>{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#C9A84C] mb-4">Get Started</div>
          <h2 className="text-4xl text-white mb-4" style={{ fontWeight: 400 }}>Ready to secure your R&D evidence?</h2>
          <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto leading-relaxed">
            Use the calculator above to confirm your case is viable, then generate your Paper Key to begin capturing evidence immediately.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#calculator" className="px-8 py-3.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b560] transition-colors tracking-wide shadow-[0_0_40px_rgba(201,168,76,0.2)]">
              See If You Qualify
            </a>
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-3.5 border border-white/15 text-slate-300 text-sm rounded-lg hover:bg-white/5 transition-colors tracking-wide"
            >
              Client Login
            </button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-slate-600">Sovereign Vault · R&D Evidence Platform</div>
          <div className="text-[11px] text-slate-600">
            This platform does not constitute tax advice. Consult a qualified R&D tax specialist before filing.
          </div>
        </div>
      </footer>

    </div>
  );
}