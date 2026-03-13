"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardCompany } from "@/lib/api";

const WORD_COUNT = 12;
const JURISDICTIONS = [
  { value: "uk", label: "UK" },
  { value: "us", label: "US" },
  { value: "uae", label: "UAE" },
] as const;

function extractPaperKey(payload: unknown): string[] | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.paper_key)) {
    return p.paper_key.map((w) => String(w));
  }
  if (typeof p.paper_key === "string") {
    return p.paper_key.trim().split(/\s+/).filter(Boolean);
  }
  if (Array.isArray(p.words)) return p.words.map((w) => String(w));
  if (typeof p.paperKey === "string") {
    return p.paperKey.trim().split(/\s+/).filter(Boolean);
  }
  return null;
}

export default function GenerateKeyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [jurisdiction, setJurisdiction] = useState<string>("uk");
  const [words, setWords] = useState<string[] | null>(null);
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => companyName.trim().length > 0 && ["uk", "us", "uae"].includes(jurisdiction),
    [companyName, jurisdiction]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onboardCompany(
        companyName.trim(),
        jurisdiction.toLowerCase()
      );
      const extracted = extractPaperKey(res);
      if (!extracted || extracted.length !== WORD_COUNT) {
        throw new Error("Unexpected response: expected 12-word paper key");
      }
      setWords(extracted);
      setAck(false);
    } catch {
      setError("Failed to generate paper key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4 py-8">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-400">
            SOVEREIGN VAULT
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Generate Your Paper Key
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Your 12-word paper key is the only way to access your forensic vault.
          </p>
        </div>

        {!words ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Research Ltd"
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#003153] focus:border-[#003153]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Jurisdiction
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#003153] focus:border-[#003153]"
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j.value} value={j.value} className="bg-[#0a0f1a] text-white">
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Generating…" : "Generate Paper Key"}
            </button>

            <p className="text-xs text-slate-400">
              Already have a key?{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-slate-200"
                onClick={() => router.push("/login")}
              >
                Go to Login →
              </button>
            </p>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {words.map((word, idx) => (
                <div
                  key={idx}
                  className="rounded-md bg-white/10 border border-white/10 px-3 py-2"
                >
                  <div className="text-[10px] text-slate-400 mb-0.5">
                    {idx + 1}
                  </div>
                  <div className="font-mono-hash text-sm text-white break-all">
                    {word}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-red-500/50 bg-red-500/15 px-3 py-3 text-xs text-red-200 mb-4">
              Write down all 12 words in order. This key cannot be recovered if
              lost.
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-200 mb-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-[3px] h-3 w-3 border border-slate-500 bg-black/40 rounded"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              <span>
                I have written down my 12-word paper key and stored it safely
                offline. I understand it cannot be recovered.
              </span>
            </label>

            <div className="flex flex-col gap-3">
              {ack && (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 text-white"
                >
                  Go to Login
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setWords(null);
                  setAck(false);
                  setError(null);
                }}
                className="w-full rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5 text-slate-200"
              >
                Generate another key
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
