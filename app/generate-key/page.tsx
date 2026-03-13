"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onboardCompany } from "@/lib/api";

const WORD_COUNT = 12;

function extractPaperKeyWords(payload: any): string[] | null {
  if (!payload) return null;
  if (Array.isArray(payload.words)) return payload.words.map((w: any) => String(w));
  if (Array.isArray(payload.paper_key)) return payload.paper_key.map((w: any) => String(w));
  if (typeof payload.paper_key === "string") return payload.paper_key.trim().split(/\s+/);
  if (typeof payload.paperKey === "string") return payload.paperKey.trim().split(/\s+/);
  return null;
}

export default function GenerateKeyPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [words, setWords] = useState<string[] | null>(null);
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => companyName.trim().length > 1, [companyName]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!canGenerate || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await onboardCompany(companyName.trim());
      const extracted = extractPaperKeyWords(res);
      if (!extracted || extracted.length !== WORD_COUNT) {
        throw new Error("Unexpected onboard response");
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
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
      <div className="max-w-2xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        <div className="mb-4">
          <p className="text-[11px] tracking-[0.3em] uppercase text-slate-300">
            SOVEREIGN VAULT
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Generate Your Paper Key</h1>
          <p className="mt-1 text-xs text-slate-400">
            Your 12-word paper key is the only way to access your forensic vault.
          </p>
        </div>

        <div className="mb-4 rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Write it down and store it offline. It cannot be recovered if lost.
        </div>

        {!words ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Research Ltd"
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#003153] focus:border-[#003153]"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canGenerate || loading}
              className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Generating…" : "Generate Paper Key"}
            </button>

            <div className="text-xs text-slate-400">
              Already have a key?{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-slate-200"
                onClick={() => router.push("/login")}
              >
                Go to Login →
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {words.map((word, idx) => (
                <div
                  key={idx}
                  className="rounded-md bg-white/10 border border-white/10 px-3 py-2"
                >
                  <div className="text-[10px] text-slate-400 mb-1">{idx + 1}</div>
                  <div className="font-mono-hash text-xs text-white break-all">
                    {word}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-[3px] h-3 w-3 border border-slate-500 bg-black/40"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                <span>
                  I have written down my paper key. I understand it cannot be
                  recovered if lost.
                </span>
              </label>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2 mt-3">
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {ack && (
                <button
                  type="button"
                  className="w-full rounded-md bg-[#003153] hover:bg-[#003153]/90 text-sm font-medium py-2.5"
                  onClick={() => router.push("/login")}
                >
                  Go to Login
                </button>
              )}

              <button
                type="button"
                className="w-full rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium py-2.5"
                onClick={() => {
                  setWords(null);
                  setAck(false);
                  setError(null);
                }}
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

